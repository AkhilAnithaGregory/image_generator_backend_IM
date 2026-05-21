import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    createPullRequest,
    getProjectPullRequests,
    getSinglePullRequest,
    acceptPullRequest,
    rejectPullRequest,
    mergePullRequest
} from "../controllers/pullRequestController.js";

const router = express.Router();


// CREATE PR
router.post(
    "/pull-requests",
    authMiddleware,
    createPullRequest
);


// GET PROJECT PRS
router.get(
    "/projects/:projectId/pull-requests",
    authMiddleware,
    getProjectPullRequests
);


// GET SINGLE PR
router.get(
    "/pull-requests/:pullRequestId",
    authMiddleware,
    getSinglePullRequest
);


// ACCEPT PR
router.post(
    "/pull-requests/:pullRequestId/accept",
    authMiddleware,
    acceptPullRequest
);


// REJECT PR
router.post(
    "/pull-requests/:pullRequestId/reject",
    authMiddleware,
    rejectPullRequest
);

router.post(
    "/pull-requests/:pullRequestId/merge",
    authMiddleware,
    mergePullRequest
);

export default router;