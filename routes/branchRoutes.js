import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    getBranches,
    createBranch,
    deleteBranch,
    pullLatest,
    pushBranch,
} from "../controllers/branchController.js";

const router = express.Router();


// GET ALL BRANCHES
router.get(
    "/projects/:projectId/branches",
    authMiddleware,
    getBranches
);


// CREATE BRANCH
router.post(
    "/projects/:projectId/branches",
    authMiddleware,
    createBranch
);


// DELETE BRANCH
router.delete(
    "/branches/:branchId",
    authMiddleware,
    deleteBranch
);


// PULL LATEST
router.get(
    "/branches/:branchId/pull",
    authMiddleware,
    pullLatest
);


// PUSH BRANCH
router.post(
    "/branches/:branchId/push",
    authMiddleware,
    pushBranch
);

export default router;