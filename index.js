import dotenv from "dotenv";
dotenv.config();

import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cloudinary from "cloudinary";

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// CLOUDINARY CONFIG
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// UPLOAD HELPER
const uploadToCloudinary = async (filePath) => {
    const result = await cloudinary.v2.uploader.upload(filePath, {
        folder: "ai-generator",
    });

    return result.secure_url;
};

// GENERATE ROUTE
app.post(
    "/generate",
    upload.fields([
        { name: "images", maxCount: 5 },
        { name: "previousImage", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-3.1-flash-image-preview",
            });

            const prompt = req.body.prompt || "Transform this image creatively";

            const enhancedPrompt = `${prompt}, highly realistic, ultra detailed, natural lighting, 4k, sharp focus, professional photography`;

            const uploadedImages = req.files?.images || [];
            const previousImage = req.files?.previousImage || [];

            const allImages = [...uploadedImages, ...previousImage];

            const imageParts = allImages.map((file) => {
                const buffer = fs.readFileSync(file.path);

                return {
                    inlineData: {
                        mimeType: file.mimetype,
                        data: buffer.toString("base64"),
                    },
                };
            });

            const contents = [{ text: enhancedPrompt }, ...imageParts];

            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: contents,
                    },
                ],
                generationConfig: {
                    responseModalities: ["IMAGE", "TEXT"],
                },
            });

            const response = result.response;
            const candidate = response?.candidates?.[0];

            if (!candidate) {
                return res.status(500).json({ error: "No candidates returned" });
            }

            const parts = candidate?.content?.parts || [];

            const imagePart = parts.find((p) => p.inlineData);
            const textPart = parts.find((p) => p.text);

            if (!imagePart) {
                return res.status(500).json({ error: "No image generated" });
            }

            // SAVE GENERATED IMAGE TEMP
            const buffer = Buffer.from(imagePart.inlineData.data, "base64");

            const tempPath = `uploads/generated-${Date.now()}.png`;
            fs.writeFileSync(tempPath, buffer);

            // UPLOAD TO CLOUDINARY
            const imageUrl = await uploadToCloudinary(tempPath);

            // cleanup generated file
            fs.unlinkSync(tempPath);

            // RESPONSE
            res.json({
                image: imageUrl,
                text: textPart?.text || "",
            });
        } catch (error) {
            console.error("Generation error:", error);
            res.status(500).json({ error: error.message });
        } finally {
            const allFiles = [
                ...(req.files?.images || []),
                ...(req.files?.previousImage || []),
            ];

            allFiles.forEach((f) => fs.unlink(f.path, () => { }));
        }
    }
);

// TEST ROUTE
app.get("/hi", async (req, res) => {
    res.send("Hello from backend!");
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});