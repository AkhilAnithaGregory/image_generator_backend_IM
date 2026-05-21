import Branch from "../models/Branch.js";
import Project from "../models/Project.js";
import Commit from "../models/Commit.js";



// GET ALL BRANCHES
export const getBranches =
    async (req, res) => {
        try {
            const branches =
                await Branch.find({
                    project:
                        req.params.projectId,
                })
                    .populate(
                        "owner",
                        "username email"
                    )
                    .sort({
                        createdAt: 1,
                    });

            res.status(200).json(
                branches
            );
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    error.message,
            });
        }
    };



// CREATE BRANCH
export const createBranch =
    async (req, res) => {
        try {
            const { name } = req.body;

            const project =
                await Project.findById(
                    req.params.projectId
                );

            if (!project) {
                return res.status(404).json({
                    message:
                        "Project not found",
                });
            }

            // check existing branch
            const existingBranch =
                await Branch.findOne({
                    project:
                        project._id,
                    name,
                });

            if (existingBranch) {
                return res.status(400).json({
                    message:
                        "Branch already exists",
                });
            }

            // create branch
            const branch =
                await Branch.create({
                    name,

                    project:
                        project._id,

                    owner:
                        req.user.id,

                    isMain: false,
                });

            res.status(201).json({
                message:
                    "Branch created successfully",

                branch,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    error.message,
            });
        }
    };



// DELETE BRANCH
export const deleteBranch =
    async (req, res) => {
        try {
            const branch =
                await Branch.findById(
                    req.params.branchId
                );

            if (!branch) {
                return res.status(404).json({
                    message:
                        "Branch not found",
                });
            }

            // cannot delete main
            if (branch.isMain) {
                return res.status(400).json({
                    message:
                        "Cannot delete main branch",
                });
            }

            // only owner
            if (
                branch.owner.toString() !==
                req.user.id
            ) {
                return res.status(403).json({
                    message:
                        "Unauthorized",
                });
            }

            // delete commits
            await Commit.deleteMany({
                branch:
                    branch._id,
            });

            // delete branch
            await branch.deleteOne();

            res.status(200).json({
                message:
                    "Branch deleted successfully",
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    error.message,
            });
        }
    };



// PULL LATEST
export const pullLatest =
    async (req, res) => {
        try {
            const branch =
                await Branch.findById(
                    req.params.branchId
                );

            if (!branch) {
                return res.status(404).json({
                    message:
                        "Branch not found",
                });
            }

            // latest commit
            const latestCommit =
                await Commit.findOne({
                    branch:
                        branch._id,
                }).sort({
                    version: -1,
                });

            if (!latestCommit) {
                return res.status(404).json({
                    message:
                        "No commits found",
                });
            }

            res.status(200).json({
                branch,

                latestCommit,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    error.message,
            });
        }
    };



// PUSH BRANCH
export const pushBranch =
    async (req, res) => {
        try {
            const branch =
                await Branch.findById(
                    req.params.branchId
                );

            if (!branch) {
                return res.status(404).json({
                    message:
                        "Branch not found",
                });
            }

            // only branch owner
            if (
                branch.owner.toString() !==
                req.user.id
            ) {
                return res.status(403).json({
                    message:
                        "Unauthorized",
                });
            }

            // latest commit
            const latestCommit =
                await Commit.findOne({
                    branch:
                        branch._id,
                }).sort({
                    version: -1,
                });

            if (!latestCommit) {
                return res.status(404).json({
                    message:
                        "No commits found",
                });
            }

            res.status(200).json({
                message:
                    "Branch pushed successfully",

                latestCommit,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message:
                    error.message,
            });
        }
    };