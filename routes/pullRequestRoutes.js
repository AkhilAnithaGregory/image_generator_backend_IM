import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as pull from "../controllers/pullRequestController.js";
const router = express.Router();

router.post("/", authMiddleware, pull.createPullRequest);
router.get("/:projectId/all", authMiddleware, pull.getPullRequests);
router.post("/accept/:pullRequestId", authMiddleware, pull.acceptPullRequest);
router.post("/reject/:pullRequestId", authMiddleware, pull.rejectPullRequest);

export default router;