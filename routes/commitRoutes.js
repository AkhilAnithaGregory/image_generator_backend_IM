import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    createCommit,
    getBranchCommits,
    getSingleCommit,
    deleteCommit,
} from "../controllers/commitController.js";

const router = express.Router();


// CREATE COMMIT
router.post(
    "/branches/:branchId/commit",
    authMiddleware,
    createCommit
);


// GET BRANCH COMMITS
router.get(
    "/branches/:branchId/commits",
    authMiddleware,
    getBranchCommits
);


// GET SINGLE COMMIT
router.get(
    "/commits/:commitId",
    authMiddleware,
    getSingleCommit
);


// DELETE COMMIT
router.delete(
    "/commits/:commitId",
    authMiddleware,
    deleteCommit
);

export default router;