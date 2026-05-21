import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    createProject,
    getProjects,
    getSingleProject,
    updateProjectName,
    deleteProject,
} from "../controllers/projectController.js";

const router = express.Router();


// CREATE PROJECT
router.post(
    "/projects",
    authMiddleware,
    createProject
);


// GET ALL PROJECTS
router.get(
    "/projects",
    authMiddleware,
    getProjects
);


// GET SINGLE PROJECT
router.get(
    "/projects/:projectId",
    authMiddleware,
    getSingleProject
);


// UPDATE PROJECT NAME
router.put(
    "/projects/:projectId",
    authMiddleware,
    updateProjectName
);


// DELETE PROJECT
router.delete(
    "/projects/:projectId",
    authMiddleware,
    deleteProject
);

export default router;