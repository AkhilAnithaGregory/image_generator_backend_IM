import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createPullRequest, acceptPullRequest, rejectPullRequest, mergePullRequest, } from "../controllers/pullRequestController.js";

const router = express.Router();

router.post("/pull-requests", authMiddleware, createPullRequest);
router.post("/pull-requests/:pullRequestId/accept", authMiddleware, acceptPullRequest);
router.post("/pull-requests/:pullRequestId/reject", authMiddleware, rejectPullRequest);
router.post("/pull-requests/:pullRequestId/merge", authMiddleware, mergePullRequest);

export default router;