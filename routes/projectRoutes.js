import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as project from "../controllers/projectController.js";

const router = express.Router();

router.post("/", authMiddleware, project.createProject);
router.get("/", authMiddleware, project.getProjects);
router.get("/public", project.getPublicProjects);
router.get("/:projectId", authMiddleware, project.getSingleProject);
router.put("/:projectId", authMiddleware, project.updateProject);
router.delete("/:projectId", authMiddleware, project.deleteProject);
router.post("/fork/:projectId", authMiddleware, project.forkProject);

export default router;