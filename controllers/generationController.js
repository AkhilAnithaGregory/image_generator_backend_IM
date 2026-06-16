import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Branch from "../models/Branch.js";
import Commit from "../models/Commit.js";
import cloudinary from "../config/cloudinary.js";
import { checkProjectAccess } from "../helper/projectHelper.js";

const uploadToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "ai-generator",
  });
  return result.secure_url;
};

export const generateImage = async (req, res) => {
  try {
    const {
      projectId,
      branchId,
      prompt,
      aspectRatio,
      modelName,
      lastKnownVersion,
    } = req.body;

    /* ✅ VALIDATION */
    if (!prompt) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    let state = {};
    try {
      state = req.body.state ? JSON.parse(req.body.state) : {};
    } catch {
      state = {};
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "GEMINI_API_KEY not set",
      });
    }

    /* ✅ AI MODEL */
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName || "gemini-3.1-flash-image-preview",
    });

    const enhancedPrompt = `${prompt}

You are an image editing AI performing masked inpainting.
`;

    /* ✅ FILES */
    const uploadedImages = req.files?.images || [];
    const previousImage = req.files?.previousImage || [];
    const drawingImage = req.files?.drawing || [];

    const contents = [{ text: enhancedPrompt }];

    if (previousImage.length > 0) {
      contents.push({ text: "BASE IMAGE:" });
      contents.push({
        inlineData: {
          mimeType: previousImage[0].mimetype,
          data: fs.readFileSync(previousImage[0].path).toString("base64"),
        },
      });
    }

    if (drawingImage.length > 0) {
      contents.push({ text: "MASK IMAGE:" });
      contents.push({
        inlineData: {
          mimeType: drawingImage[0].mimetype,
          data: fs.readFileSync(drawingImage[0].path).toString("base64"),
        },
      });
    }

    /* ✅ GENERATE IMAGE */
    const result = await model.generateContent({
      contents: [{ role: "user", parts: contents }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
        },
      },
    });

    const candidate = result.response?.candidates?.[0];

    if (!candidate) {
      return res.status(500).json({
        message: "No response from model",
      });
    }

    const parts = candidate?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData);
    const textPart = parts.find((p) => p.text);

    if (!imagePart) {
      return res.status(500).json({
        message: "No image generated",
      });
    }

    /* ✅ SAVE IMAGE */
    const buffer = Buffer.from(
      imagePart.inlineData.data,
      "base64"
    );

    const tempPath = `uploads/generated-${Date.now()}.png`;
    fs.writeFileSync(tempPath, buffer);

    const imageUrl = await uploadToCloudinary(tempPath);
    fs.unlinkSync(tempPath);

    let commit = null;

    /* ✅ ✅ ✅ SAFE COMMIT BLOCK */
    if (projectId && branchId && req.user?.id) {
      const branch = await Branch.findById(branchId);

      if (!branch) {
        return res.status(404).json({
          message: "Branch not found",
        });
      }

      /* ✅ ACCESS CONTROL */
      const { error } = await checkProjectAccess(
        projectId,
        req.user.id
      );

      if (error) {
        return res.status(403).json({
          message: error,
        });
      }

      const latestCommit = await Commit.findOne({
        branch: branchId,
      }).sort({ version: -1 });

      /* ✅ CONFLICT CONTROL */
      if (
        latestCommit &&
        lastKnownVersion !== undefined &&
        latestCommit.version !== lastKnownVersion
      ) {
        return res.status(409).json({
          message: "Conflict detected. Pull latest first.",
          latestVersion: latestCommit.version,
        });
      }

      const nextVersion = latestCommit
        ? latestCommit.version + 1
        : 1;

      commit = await Commit.create({
        project: projectId,
        branch: branchId,
        createdBy: req.user.id,
        version: nextVersion,
        message: "AI Generated Image",
        state,
        generatedImage: imageUrl,
        prompt,
      });

      branch.version = nextVersion;
      branch.latestCommit = commit._id;

      await branch.save();
    }

    /* ✅ RESPONSE */
    return res.status(201).json({
      image: imageUrl,
      text: textPart?.text || "",
      commit, // null if not logged in ✅
      aspectRatio,
      modelName,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};