import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import PullRequest from "../models/PullRequest.js";

export const createPullRequest = async (
    req,
    res
) => {
    try {
        const {
            projectId,
            fromBranchId,
            toBranchId,
            title,
        } = req.body;

        // create PR
        const pr = await PullRequest.create({
            project: projectId,
            fromBranch: fromBranchId,
            toBranch: toBranchId,
            createdBy: req.user.id,
            title,
        });

        // find project owner
        const project = await Project.findById(
            projectId
        );

        // create notification
        const notification =
            await Notification.create({
                receiver: project.owner,

                sender: req.user.id,

                project: projectId,

                type: "PULL_REQUEST",

                message:
                    "New pull request created",

                data: {
                    pullRequestId: pr._id,
                },
            });

        // SOCKET EVENT
        const io = req.app.get("io");

        io.to(project.owner.toString()).emit(
            "notification",
            notification
        );

        res.status(201).json(pr);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getProjectPullRequests =
    async (req, res) => {
        try {
            const prs =
                await PullRequest.find({
                    project:
                        req.params.projectId,
                })
                    .populate(
                        "createdBy",
                        "username email"
                    )
                    .populate(
                        "fromBranch",
                        "name"
                    )
                    .populate(
                        "toBranch",
                        "name"
                    )
                    .sort({
                        createdAt: -1,
                    });

            res.status(200).json(prs);
        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    };

export const getSinglePullRequest =
    async (req, res) => {
        try {
            const pr =
                await PullRequest.findById(
                    req.params.pullRequestId
                )
                    .populate(
                        "createdBy",
                        "username email"
                    )
                    .populate(
                        "fromBranch",
                        "name"
                    )
                    .populate(
                        "toBranch",
                        "name"
                    );

            if (!pr) {
                return res.status(404).json({
                    message:
                        "Pull request not found",
                });
            }

            res.status(200).json(pr);
        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    };

export const acceptPullRequest =
    async (req, res) => {
        try {
            const pr =
                await PullRequest.findById(
                    req.params.pullRequestId
                );

            if (!pr) {
                return res.status(404).json({
                    message:
                        "Pull request not found",
                });
            }

            if (pr.status !== "open") {
                return res.status(400).json({
                    message:
                        "PR already handled",
                });
            }

            pr.status = "accepted";

            pr.mergedAt = new Date();

            pr.mergedBy = req.user.id;

            await pr.save();

            res.status(200).json({
                message:
                    "Pull request accepted",
            });
        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    };

export const rejectPullRequest =
    async (req, res) => {
        try {
            const pr =
                await PullRequest.findById(
                    req.params.pullRequestId
                );

            if (!pr) {
                return res.status(404).json({
                    message:
                        "Pull request not found",
                });
            }

            if (pr.status !== "open") {
                return res.status(400).json({
                    message:
                        "PR already handled",
                });
            }

            pr.status = "rejected";

            await pr.save();

            res.status(200).json({
                message:
                    "Pull request rejected",
            });
        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    };

export const mergePullRequest =
    async (req, res) => {
        try {
            const pr =
                await PullRequest.findById(
                    req.params.pullRequestId
                );

            if (!pr) {
                return res.status(404).json({
                    message:
                        "Pull request not found",
                });
            }

            // must be accepted first
            if (pr.status !== "accepted") {
                return res.status(400).json({
                    message:
                        "PR must be accepted before merge",
                });
            }

            // latest commit from source branch
            const latestSourceCommit =
                await Commit.findOne({
                    branch: pr.fromBranch,
                }).sort({
                    version: -1,
                });

            if (!latestSourceCommit) {
                return res.status(404).json({
                    message:
                        "No commits found in source branch",
                });
            }

            // destination branch
            const targetBranch =
                await Branch.findById(
                    pr.toBranch
                );

            // latest target commit
            const latestTargetCommit =
                await Commit.findOne({
                    branch: pr.toBranch,
                }).sort({
                    version: -1,
                });

            const nextVersion =
                latestTargetCommit
                    ? latestTargetCommit.version + 1
                    : 1;

            // create merged commit
            const mergedCommit =
                await Commit.create({
                    project: pr.project,

                    branch: pr.toBranch,

                    createdBy: req.user.id,

                    version: nextVersion,

                    message: `Merged PR: ${pr.title}`,

                    state:
                        latestSourceCommit.state,
                });

            // update branch version
            targetBranch.version =
                nextVersion;

            await targetBranch.save();

            // update PR status
            pr.status = "merged";

            pr.mergedAt = new Date();

            pr.mergedBy = req.user.id;

            await pr.save();

            res.status(200).json({
                message:
                    "Pull request merged successfully",

                mergedCommit,
            });
        } catch (error) {
            console.log(error);

            res.status(500).json({
                message: error.message,
            });
        }
    };