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
      style,
      lastKnownVersion,
    } = req.body;

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName || "gemini-3.1-flash-image-preview",
    });

    const uploadedImages = req.files?.images || [];
    const previousImage = req.files?.previousImage || [];
    const drawingImage = req.files?.drawing || [];

    const hasDrawing = drawingImage.length > 0 && fs.existsSync(drawingImage[0].path);
    const hasBase = previousImage.length > 0 && fs.existsSync(previousImage[0].path);
    const hasUploaded = uploadedImages.length > 0;

    let styleInstruction = "";
    if (style && style.trim()) {
      styleInstruction = `\nVisual Style & Aesthetics: ${style.trim()}`;
    }

    let enhancedPrompt = prompt;
    const contents = [];

    // Case 1: Inpainting with drawing mask on base canvas image
    if (hasDrawing && hasBase) {
      if (hasUploaded) {
        enhancedPrompt = `You are an expert AI image editor performing masked inpainting.
USER PROMPT: ${prompt}${styleInstruction}

TASK:
Redraw ONLY the area indicated by the MASK IMAGE on the BASE IMAGE. In this masked area, incorporate the person/subject shown in the attached REFERENCE IMAGES. Faithfully preserve their facial features, identity, expression, and appearance while seamlessly blending with the surrounding base image.`;
      } else {
        enhancedPrompt = `You are an expert AI image editor performing masked inpainting.
USER PROMPT: ${prompt}${styleInstruction}

TASK:
Redraw ONLY the area indicated by the MASK IMAGE on the BASE IMAGE according to the prompt, seamlessly blending with the base image.`;
      }

      contents.push({ text: "BASE IMAGE (current scene):" });
      contents.push({
        inlineData: {
          mimeType: previousImage[0].mimetype,
          data: fs.readFileSync(previousImage[0].path).toString("base64"),
        },
      });

      contents.push({ text: "MASK IMAGE (indicates area to modify/inpaint):" });
      contents.push({
        inlineData: {
          mimeType: drawingImage[0].mimetype,
          data: fs.readFileSync(drawingImage[0].path).toString("base64"),
        },
      });

      if (hasUploaded) {
        contents.push({ text: "REFERENCE IMAGES (use this person/subject/face to inpaint):" });
        for (const img of uploadedImages) {
          if (fs.existsSync(img.path)) {
            contents.push({
              inlineData: {
                mimeType: img.mimetype,
                data: fs.readFileSync(img.path).toString("base64"),
              },
            });
          }
        }
      }

      contents.push({ text: enhancedPrompt });
    }
    // Case 2: Adding / integrating uploaded reference subject into existing canvas base image
    else if (hasBase && hasUploaded) {
      enhancedPrompt = `You are an elite professional photo compositor and retoucher with expertise in creating photorealistic composites.
USER PROMPT: ${prompt}${styleInstruction}

TASK:
You are provided with a BASE SCENE IMAGE and one or more REFERENCE IMAGES showing specific people/subjects.
Your goal is to create a single, perfectly composited final image where the reference people are naturally integrated into the base scene.

CRITICAL INSTRUCTIONS (follow ALL strictly):

1. FACE & IDENTITY PRESERVATION (HIGHEST PRIORITY):
   - You MUST replicate each person's EXACT face: facial bone structure, eye shape & color, nose shape, lip shape, eyebrow thickness, jawline, chin, forehead proportions.
   - Preserve their EXACT hair color, hair texture, hairstyle length, and hair parting.
   - Preserve their skin tone, complexion, and any visible distinguishing features (moles, freckles, dimples, etc.).
   - The faces in the final image must be clearly recognizable as the SAME people from the reference images.

2. SCENE-APPROPRIATE WARDROBE ADAPTATION:
   - Do NOT keep the reference person's original clothing if it clashes with the scene context.
   - Dress them in clothing that naturally fits the scene's theme, setting, and mood (e.g., if it's a Christmas scene, put them in festive/holiday attire; if formal, dress them formally).
   - The clothing should look like it belongs in the scene, matching the style and era of other people present.

3. NATURAL SCALE, PERSPECTIVE & POSITIONING:
   - Match the body proportions, height scale, and perspective angle of the existing people in the base scene.
   - Position the added people at a natural distance and angle relative to others, respecting depth of field and spatial relationships.
   - Ensure their feet/ground contact point is consistent with the scene's floor/ground plane.

4. LIGHTING & COLOR HARMONY:
   - Match the EXACT lighting direction, intensity, color temperature, and shadow angles from the base scene.
   - Apply the same color grading, contrast level, and film grain/noise pattern as the base scene.
   - Ensure shadows cast by the added person are consistent with other shadows in the scene.

5. SEAMLESS BLENDING:
   - There should be NO visible seams, edges, or artifacts where the new person meets the background.
   - All existing people, objects, and background elements in the BASE SCENE must remain COMPLETELY UNCHANGED.
   - The final result should look like a single photograph where everyone was present together.

6. NATURAL INTERACTION & POSING:
   - Give the added person a natural, relaxed pose that fits the scene's mood and context.
   - If the scene involves interaction (group photo, gathering), pose them as a natural participant.
   - Their eye direction and body language should feel cohesive with the group.`;

      contents.push({ text: "BASE SCENE IMAGE (the existing scene — all existing elements must be preserved exactly):" });
      contents.push({
        inlineData: {
          mimeType: previousImage[0].mimetype,
          data: fs.readFileSync(previousImage[0].path).toString("base64"),
        },
      });

      contents.push({ text: "REFERENCE IMAGES — these are the SPECIFIC people to add. PRESERVE their exact face, identity, and likeness. ADAPT their clothing to fit the scene:" });
      for (const img of uploadedImages) {
        if (fs.existsSync(img.path)) {
          contents.push({
            inlineData: {
              mimeType: img.mimetype,
              data: fs.readFileSync(img.path).toString("base64"),
            },
          });
        }
      }

      contents.push({ text: enhancedPrompt });
    }
    // Case 3: Generating a new image guided by uploaded reference images (no base canvas image)
    else if (hasUploaded) {
      enhancedPrompt = `You are an elite professional AI photographer and portrait artist.
USER PROMPT: ${prompt}${styleInstruction}

TASK:
Generate a new photorealistic, high-quality image fulfilling the user's prompt.

CRITICAL INSTRUCTIONS:
1. FACE & IDENTITY (HIGHEST PRIORITY): The attached REFERENCE IMAGES show the EXACT person(s) who must appear in the generated image. You MUST replicate their precise facial bone structure, eye shape & color, nose, lips, jawline, chin, eyebrows, hair color, hair texture, hairstyle, skin tone, and any distinguishing features (moles, freckles, dimples).
2. The person in the final image must be IMMEDIATELY recognizable as the same individual from the reference.
3. Adapt their clothing, pose, expression, and setting to match the user's prompt and scene context.
4. Ensure professional-quality lighting, composition, and photorealistic rendering.`;

      contents.push({ text: "REFERENCE IMAGES — these show the EXACT person(s) whose face, identity, and likeness MUST be faithfully reproduced:" });
      for (const img of uploadedImages) {
        if (fs.existsSync(img.path)) {
          contents.push({
            inlineData: {
              mimeType: img.mimetype,
              data: fs.readFileSync(img.path).toString("base64"),
            },
          });
        }
      }

      contents.push({ text: enhancedPrompt });
    }
    // Case 4: Variation / update of base canvas image alone (no uploaded reference images)
    else if (hasBase) {
      enhancedPrompt = `You are an AI image editor.
USER PROMPT: ${prompt}${styleInstruction}

TASK:
Using the attached BASE IMAGE as the visual foundation, generate an updated version or variation fulfilling the prompt while maintaining visual continuity.`;

      contents.push({ text: "BASE IMAGE FOR VARIATION:" });
      contents.push({
        inlineData: {
          mimeType: previousImage[0].mimetype,
          data: fs.readFileSync(previousImage[0].path).toString("base64"),
        },
      });

      contents.push({ text: enhancedPrompt });
    }
    // Case 5: Pure text prompt
    else {
      enhancedPrompt = `${prompt}${styleInstruction}`;
      contents.push({ text: enhancedPrompt });
    }

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

    const buffer = Buffer.from(
      imagePart.inlineData.data,
      "base64"
    );

    const tempPath = `uploads/generated-${Date.now()}.png`;
    fs.writeFileSync(tempPath, buffer);

    const imageUrl = await uploadToCloudinary(tempPath);
    fs.unlinkSync(tempPath);

    let commit = null;

    if (projectId && branchId && req.user?.id) {
      const branch = await Branch.findById(branchId);

      if (!branch) {
        return res.status(404).json({
          message: "Branch not found",
        });
      }

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

    let drawingUrl = null;

    if (drawingImage.length > 0) {
      drawingUrl = await uploadToCloudinary(drawingImage[0].path);

      fs.unlinkSync(drawingImage[0].path);
    }
    let uploadedImageUrls = [];

    if (uploadedImages.length > 0) {
      for (const img of uploadedImages) {
        const url = await uploadToCloudinary(img.path);
        uploadedImageUrls.push(url);

        if (fs.existsSync(img.path)) {
          fs.unlinkSync(img.path);
        }
      }
    }

    return res.status(201).json({
      image: imageUrl,
      text: textPart?.text || "",
      drawingImage: drawingUrl,
      uploadedImages: uploadedImageUrls,
      commit,
      aspectRatio,
      modelName,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};