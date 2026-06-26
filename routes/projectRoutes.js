import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createProject, getProjects, getSingleProject, updateProject, deleteProject, getPublicProjects, forkProject } from "../controllers/projectController.js";

const router = express.Router();

router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/public", getPublicProjects);
router.get("/:projectId", authMiddleware, getSingleProject);
router.put("/:projectId", authMiddleware, updateProject);
router.delete("/:projectId", authMiddleware, deleteProject);
router.post("/fork/:projectId", authMiddleware, forkProject);

export default router;