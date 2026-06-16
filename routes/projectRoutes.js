import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createProject, getProjects, getSingleProject, updateProjectName, deleteProject, } from "../controllers/projectController.js";

const router = express.Router();

router.post("/projects", authMiddleware, createProject);
router.get("/projects", authMiddleware, getProjects);
router.get("/projects/:projectId", authMiddleware, getSingleProject);
router.put("/projects/:projectId", authMiddleware, updateProjectName);
router.delete("/projects/:projectId", authMiddleware, deleteProject);

export default router;