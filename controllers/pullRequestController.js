import PullRequest from "../models/PullRequest.js";
import Project from "../models/Project.js";
import Branch from "../models/Branch.js";
import Commit from "../models/Commit.js";
import Notification from "../models/Notification.js";
import { checkProjectAccess } from "../helper/projectHelper.js";

export const createPullRequest = async (req, res) => {
    try {
        const { projectId, fromBranchId, toBranchId, title } = req.body;

        const { error, project } = await checkProjectAccess(
            projectId,
            req.user.id
        );
        if (error) return res.status(403).json({ message: error });

        const pr = await PullRequest.create({
            project: projectId,
            fromBranch: fromBranchId,
            toBranch: toBranchId,
            createdBy: req.user.id,
            title,
        });

        const notification = await Notification.create({
            receiver: project.owner,
            sender: req.user.id,
            project: projectId,
            type: "PULL_REQUEST",
            message: "New pull request created",
            data: { pullRequestId: pr._id },
        });

        const io = req.app.get("io");
        io.to(project.owner.toString()).emit("notification", notification);

        res.status(201).json(pr);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const acceptPullRequest = async (req, res) => {
    try {
        const pr = await PullRequest.findById(req.params.pullRequestId);

        if (!pr) {
            return res.status(404).json({ message: "PR not found" });
        }

        const { error } = await checkProjectAccess(pr.project, req.user.id);
        if (error) return res.status(403).json({ message: error });

        if (pr.status !== "open") {
            return res.status(400).json({ message: "PR already handled" });
        }

        pr.status = "accepted";
        pr.mergedAt = new Date();
        pr.mergedBy = req.user.id;

        await pr.save();

        res.status(200).json({ message: "PR accepted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const rejectPullRequest = async (req, res) => {
    try {
        const pr = await PullRequest.findById(req.params.pullRequestId);

        if (!pr) {
            return res.status(404).json({ message: "PR not found" });
        }

        const { error } = await checkProjectAccess(pr.project, req.user.id);
        if (error) return res.status(403).json({ message: error });

        if (pr.status !== "open") {
            return res.status(400).json({ message: "PR already handled" });
        }

        pr.status = "rejected";
        await pr.save();

        res.status(200).json({ message: "PR rejected" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const mergePullRequest = async (req, res) => {
    try {
        const pr = await PullRequest.findById(req.params.pullRequestId);

        if (!pr) {
            return res.status(404).json({ message: "PR not found" });
        }

        const { error } = await checkProjectAccess(pr.project, req.user.id);
        if (error) return res.status(403).json({ message: error });

        if (pr.status !== "accepted") {
            return res.status(400).json({
                message: "PR must be accepted first",
            });
        }

        const sourceCommit = await Commit.findOne({
            branch: pr.fromBranch,
        }).sort({ version: -1 });

        if (!sourceCommit) {
            return res.status(404).json({
                message: "No commits in source branch",
            });
        }

        const targetBranch = await Branch.findById(pr.toBranch);

        const targetCommit = await Commit.findOne({
            branch: pr.toBranch,
        }).sort({ version: -1 });

        const nextVersion = targetCommit ? targetCommit.version + 1 : 1;

        const mergedCommit = await Commit.create({
            project: pr.project,
            branch: pr.toBranch,
            createdBy: req.user.id,
            version: nextVersion,
            message: `Merge: ${pr.title}`,
            state: sourceCommit.state,
        });

        targetBranch.version = nextVersion;
        targetBranch.latestCommit = mergedCommit._id;
        await targetBranch.save();

        pr.status = "merged";
        pr.mergedBy = req.user.id;
        pr.mergedAt = new Date();
        await pr.save();

        res.status(200).json({
            message: "Merged successfully",
            commit: mergedCommit,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};