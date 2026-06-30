import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as commit from "../controllers/commitController.js";

const router = express.Router();

router.post("/:branchId", authMiddleware, commit.commitChanges);
router.get("/branches/:branchId/commits", authMiddleware, commit.getCommits);
router.get("/commits/:commitId", authMiddleware, commit.getSingleCommit);
router.delete("/commits/:commitId", authMiddleware, commit.deleteCommit);
router.post("/commits/:commitId/revert", authMiddleware, commit.revertToCommit);

export default router;