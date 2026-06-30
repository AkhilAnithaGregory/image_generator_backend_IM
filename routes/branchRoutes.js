import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as branch from "../controllers/branchController.js";
import * as pull from "../controllers/commitController.js";

const router = express.Router();

router.get("/:projectId", authMiddleware, branch.getBranches);
router.post("/:projectId", authMiddleware, branch.createBranch);
router.delete("/:branchId", authMiddleware, branch.deleteBranch);
router.get("/:branchId/pull", authMiddleware, pull.pullLatest);

export default router;