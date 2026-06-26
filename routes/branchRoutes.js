import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getBranches, createBranch, deleteBranch } from "../controllers/branchController.js";

import { pullLatest } from "../controllers/commitController.js";

const router = express.Router();

router.get("/:projectId", authMiddleware, getBranches);
router.post("/:projectId", authMiddleware, createBranch);
router.delete("/:branchId", authMiddleware, deleteBranch);
router.get("/:branchId/pull", authMiddleware, pullLatest);

export default router;