import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Branch from "../models/Branch.js";
import Project from "../models/Project.js";
import Commit from "../models/Commit.js";
import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary =
    async (filePath) => {
        const result =
            await cloudinary.uploader.upload(
                filePath,
                {
                    folder:
                        "ai-generator",
                }
            );

        return result.secure_url;
    };

export const generateImage =
    async (req, res) => {
        try {
            const {
                projectId,
                branchId,
                prompt,
                aspectRatio,
                modelName,
                style
            } = req.body;

            let state = {};

            try {
                state = req.body.state
                    ? JSON.parse(
                        req.body.state
                    )
                    : {};
            } catch (err) {
                state = {};
            }


            if (!process.env.GEMINI_API_KEY) {
                return res.status(500).json({ message: 'GEMINI_API_KEY not set in environment' });
            }

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

            const model = genAI.getGenerativeModel({
                model: modelName || "gemini-3.1-flash-image-preview",
            });

            const enhancedPrompt = `
${prompt}

You are an image editing AI performing MASKED INPAINTING.

STRICT RULES (MUST FOLLOW EXACTLY):

1. The drawing image is a MASK.
2. ONLY modify pixels where the drawing exists.
3. DO NOT change ANYTHING outside the drawn region.
4. DO NOT remove or edit any person not covered by the drawing.
5. Replace ONLY the marked area realistically with background content.
6. Preserve perspective, lighting, shadows exactly.

FAIL CONDITION:
If you modify any area outside the drawing → the result is INVALID.

INPUT PRIORITY:
- Drawing = EXACT edit region (hard mask)
- Base image = unchanged except mask

OUTPUT: photorealistic, seamless fill, no artifacts.
`;



            const uploadedImages = req.files?.images || [];
            const previousImage = req.files?.previousImage || [];
            const drawingImage = req.files?.drawing || [];

            const allImages = [
                ...uploadedImages,
                ...previousImage,
                ...drawingImage
            ];

            const imageParts =
                allImages.map((file) => {
                    const buffer =
                        fs.readFileSync(
                            file.path
                        );

                    return {
                        inlineData: {
                            mimeType:
                                file.mimetype,

                            data: buffer.toString(
                                "base64"
                            ),
                        },
                    };
                });

            const contents = [];

            contents.push({
                text: enhancedPrompt,
            });

            if (previousImage.length > 0) {
                contents.push({
                    text: "BASE IMAGE (edit this image, keep structure):",
                });

                contents.push({
                    inlineData: {
                        mimeType: previousImage[0].mimetype,
                        data: fs.readFileSync(previousImage[0].path).toString("base64"),
                    },
                });
            }

            if (drawingImage.length > 0) {
                contents.push({
                    text: "DRAWING GUIDE (apply modifications from this sketch):",
                });

                contents.push({
                    inlineData: {
                        mimeType: drawingImage[0].mimetype,
                        data: fs.readFileSync(drawingImage[0].path).toString("base64"),
                    },
                });
            }

            uploadedImages.forEach((file) => {
                contents.push({
                    text: "REFERENCE IMAGE:",
                });

                contents.push({
                    inlineData: {
                        mimeType: file.mimetype,
                        data: fs.readFileSync(file.path).toString("base64"),
                    },
                });
            });

            const result =
                await model.generateContent({
                    contents: [
                        {
                            role: "user",

                            parts:
                                contents,
                        },
                    ],

                    generationConfig: {
                        responseModalities: [
                            "IMAGE",
                            "TEXT",
                        ],
                        imageConfig: {
                            aspectRatio: aspectRatio || "1:1"
                        }
                    },
                });

            const response =
                result.response;

            const candidate =
                response?.candidates?.[0];

            if (!candidate) {
                return res.status(500).json({
                    message:
                        "No response from model",
                });
            }

            const parts =
                candidate?.content
                    ?.parts || [];

            const imagePart =
                parts.find(
                    (p) =>
                        p.inlineData
                );

            const textPart =
                parts.find(
                    (p) => p.text
                );

            if (!imagePart) {
                return res.status(500).json({
                    message:
                        "No image generated",
                });
            }

            const buffer = Buffer.from(
                imagePart.inlineData.data,
                "base64"
            );

            const tempPath =
                `uploads/generated-${Date.now()}.png`;

            fs.writeFileSync(
                tempPath,
                buffer
            );

            const imageUrl = await uploadToCloudinary(tempPath);

            fs.unlinkSync(tempPath);
            let drawingImageUrl = null;

            if (drawingImage.length > 0) {
                drawingImageUrl = await uploadToCloudinary(
                    drawingImage[0].path
                );
            }

            const uploadedImageUrls = [];

            for (const file of uploadedImages) {
                const url = await uploadToCloudinary(file.path);
                uploadedImageUrls.push(url);
            }
            await Promise.all(
                allImages.map((f) =>
                    fs.promises.unlink(f.path).catch(() => { })
                )
            );
            let commit = null;

            if (projectId && branchId) {
                const branch =
                    await Branch.findById(
                        branchId
                    );

                const project =
                    await Project.findById(
                        projectId
                    );

                if (branch && project) {
                    const latestCommit =
                        await Commit.findOne(
                            {
                                branch:
                                    branchId,
                            }
                        ).sort({
                            version:
                                -1,
                        });

                    const nextVersion =
                        latestCommit
                            ? latestCommit.version +
                            1
                            : 1;

                    commit =
                        await Commit.create(
                            {
                                project:
                                    projectId,

                                branch:
                                    branchId,

                                createdBy:
                                    req.user
                                        ?.id ||
                                    null,

                                version:
                                    nextVersion,

                                message:
                                    "AI Generated Image",

                                state:

                                    state,

                                generatedImage:
                                    imageUrl,

                                prompt:
                                    prompt,
                            }
                        );

                    branch.version =
                        nextVersion;

                    branch.latestCommit =
                        commit._id;

                    await branch.save();
                }
            }

            return res.status(201).json({
                image: imageUrl,
                text: textPart?.text || "",
                commit: commit || null,
                drawingImage: drawingImageUrl,
                uploadedImages: uploadedImageUrls,
                aspectRatio: aspectRatio,
                modelName: modelName
            });
        } catch (error) {
            res.status(500).json({
                message:
                    error.message,
            });
        }
    };