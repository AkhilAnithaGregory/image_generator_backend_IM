import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cloudinary from "cloudinary";

import Branch from "../models/Branch.js";
import Project from "../models/Project.js";
import Commit from "../models/Commit.js";

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

// CLOUDINARY CONFIG
cloudinary.v2.config({
    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET,
});



// UPLOAD HELPER
const uploadToCloudinary =
    async (filePath) => {
        const result =
            await cloudinary.v2.uploader.upload(
                filePath,
                {
                    folder:
                        "ai-generator",
                }
            );

        return result.secure_url;
    };



// MAIN GENERATION FUNCTION
export const generateImage =
    async (req, res) => {
        try {
            const {
                projectId,
                branchId,
                prompt,
            } = req.body;

            // parse state safely
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

            const model =
                genAI.getGenerativeModel({
                    model:
                        "gemini-3.1-flash-image-preview",
                });

            const enhancedPrompt =
                `${prompt},
                highly realistic,
                ultra detailed,
                natural lighting,
                4k, sharp focus,
                professional photography`;

            // images from request
            const uploadedImages =
                req.files?.images || [];

            const previousImage =
                req.files?.previousImage ||
                [];

            const allImages = [
                ...uploadedImages,
                ...previousImage,
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

            const contents = [
                {
                    text: enhancedPrompt,
                },

                ...imageParts,
            ];

            // GENERATE IMAGE
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

            // convert image
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

            // upload to cloudinary
            const imageUrl =
                await uploadToCloudinary(
                    tempPath
                );

            fs.unlinkSync(tempPath);

            // cleanup input files
            allImages.forEach((f) =>
                fs.unlink(
                    f.path,
                    () => {}
                )
            );



            // OPTIONAL: SAVE TO PROJECT (if provided)
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

            // RESPONSE
            return res.status(201).json({
                image: imageUrl,

                text:
                    textPart?.text ||
                    "",

                commit:
                    commit || null,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    error.message,
            });
        }
    };