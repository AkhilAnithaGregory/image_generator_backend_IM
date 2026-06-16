import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { commitChanges, getCommits, getSingleCommit, deleteCommit, revertToCommit, } from "../controllers/commitController.js";

const router = express.Router();

router.post("/branches/:branchId/commits", authMiddleware, commitChanges);
router.get("/branches/:branchId/commits", authMiddleware, getCommits);
router.get("/commits/:commitId", authMiddleware, getSingleCommit);
router.delete("/commits/:commitId", authMiddleware, deleteCommit);
router.post("/commits/:commitId/revert", authMiddleware, revertToCommit);

export default router;