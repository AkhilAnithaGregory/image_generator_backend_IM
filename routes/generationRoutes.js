import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";
import { generateImage } from "../controllers/generationController.js";
const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/generate", upload.fields([
    { name: "images", maxCount: 4 },
    { name: "previousImage", maxCount: 1 },
    { name: "drawing", maxCount: 1 },
]),

    generateImage
);

export default router;