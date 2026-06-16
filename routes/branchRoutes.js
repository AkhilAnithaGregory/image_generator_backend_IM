import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getBranches, createBranch, deleteBranch } from "../controllers/branchController.js";

import { pullLatest } from "../controllers/commitController.js";

const router = express.Router();

router.get("/projects/:projectId/branches", authMiddleware, getBranches);
router.post("/projects/:projectId/branches", authMiddleware, createBranch);
router.delete("/branches/:branchId", authMiddleware, deleteBranch);
router.get("/branches/:branchId/pull", authMiddleware, pullLatest);

export default router;