import Commit from "../models/Commit.js";
import Branch from "../models/Branch.js";
import Project from "../models/Project.js";


// CREATE COMMIT
export const createCommit = async (
    req,
    res
) => {
    try {
        const { branchId } = req.params;

        const {
            state,
            message,
        } = req.body;

        // validation
        if (!state) {
            return res.status(400).json({
                message: "State is required",
            });
        }

        // find branch
        const branch = await Branch.findById(
            branchId
        );

        if (!branch) {
            return res.status(404).json({
                message: "Branch not found",
            });
        }

        // latest commit version
        const latestCommit =
            await Commit.findOne({
                branch: branchId,
            }).sort({
                version: -1,
            });

        const nextVersion =
            latestCommit
                ? latestCommit.version + 1
                : 1;

        // create commit
        const commit = await Commit.create({
            project: branch.project,

            branch: branchId,

            createdBy: req.user.id,

            version: nextVersion,

            message:
                message ||
                `Commit v${nextVersion}`,

            state,
        });

        // update branch version
        branch.version = nextVersion;

        await branch.save();

        res.status(201).json({
            message:
                "Commit created successfully",

            commit,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};



// GET BRANCH COMMITS
export const getBranchCommits = async (
    req,
    res
) => {
    try {
        const { branchId } = req.params;

        const commits = await Commit.find({
            branch: branchId,
        })
            .populate(
                "createdBy",
                "username email"
            )
            .sort({
                version: -1,
            });

        res.status(200).json(commits);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};



// GET SINGLE COMMIT
export const getSingleCommit = async (
    req,
    res
) => {
    try {
        const commit =
            await Commit.findById(
                req.params.commitId
            ).populate(
                "createdBy",
                "username email"
            );

        if (!commit) {
            return res.status(404).json({
                message: "Commit not found",
            });
        }

        res.status(200).json(commit);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};



// DELETE COMMIT
export const deleteCommit = async (
    req,
    res
) => {
    try {
        const commit =
            await Commit.findById(
                req.params.commitId
            );

        if (!commit) {
            return res.status(404).json({
                message: "Commit not found",
            });
        }

        // only creator can delete
        if (
            commit.createdBy.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        await commit.deleteOne();

        res.status(200).json({
            message:
                "Commit deleted successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};