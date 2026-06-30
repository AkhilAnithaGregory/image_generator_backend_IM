import PullRequest from "../models/PullRequest.js";
import Project from "../models/Project.js";
import Branch from "../models/Branch.js";
import Commit from "../models/Commit.js";
import Notification from "../models/Notification.js";
import { checkProjectAccess } from "../helper/projectHelper.js";


export const createPullRequest = async (req, res) => {
  try {
    const { projectId, fromBranchId, title, description = "" } = req.body;

    const { error, project } = await checkProjectAccess(
      projectId,
      req.user.id
    );
    if (error) {
      return res.status(403).json({ message: error });
    }

    const fromBranch = await Branch.findById(fromBranchId);
    if (!fromBranch) {
      return res.status(404).json({
        message: "Source branch not found",
      });
    }

    const latestCommit = await Commit.findOne({
      branch: fromBranchId,
    }).sort({ version: -1 });

    if (!latestCommit) {
      return res.status(400).json({
        message: "No commits to create pull request",
      });
    }

    const pr = await PullRequest.create({
      project: projectId,
      fromBranch: fromBranchId,
      toBranch: project.liveBranch,
      createdBy: req.user.id,
      title,
      description,
      baseVersion: latestCommit.version,
    });

    await Notification.create({
      receiver: project.owner,
      sender: req.user.id,
      project: projectId,
      type: "PULL_REQUEST",
      message: `New pull request: ${title}`,
      data: { pullRequestId: pr._id },
    });

    res.status(201).json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getPullRequests = async (req, res) => {
  try {
    const prs = await PullRequest.find({
      project: req.params.projectId,
      status: { $in: ["open", "accepted"] },
    })
      .populate("createdBy", "username email")
      .populate("fromBranch", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(prs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const acceptPullRequest = async (req, res) => {
  try {
    const pr = await PullRequest.findById(req.params.pullRequestId);
    if (!pr) {
      return res.status(404).json({ message: "Pull request not found" });
    }

    const { error } = await checkProjectAccess(
      pr.project,
      req.user.id
    );
    if (error) {
      return res.status(403).json({ message: error });
    }

    if (pr.status !== "open") {
      return res.status(400).json({
        message: "Pull request already handled",
      });
    }

    const sourceCommit = await Commit.findOne({
      branch: pr.fromBranch,
    }).sort({ version: -1 });

    if (!sourceCommit) {
      return res.status(400).json({
        message: "No commits to merge",
      });
    }

    const targetCommit = await Commit.findOne({
      branch: pr.toBranch,
    }).sort({ version: -1 });

    const nextVersion = targetCommit
      ? targetCommit.version + 1
      : 1;

    const mergedCommit = await Commit.create({
      project: pr.project,
      branch: pr.toBranch,
      createdBy: req.user.id,
      version: nextVersion,
      message: `Merge PR: ${pr.title}`,
      state: sourceCommit.state,
    });

    pr.status = "merged";
    pr.mergedAt = new Date();
    pr.mergedBy = req.user.id;
    await pr.save();

    await Notification.create({
      receiver: pr.createdBy,
      sender: req.user.id,
      project: pr.project,
      type: "PR_MERGED",
      message: `Your pull request "${pr.title}" was merged`,
      data: { pullRequestId: pr._id },
    });

    res.status(200).json({
      message: "Pull request accepted and merged",
      commit: mergedCommit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const rejectPullRequest = async (req, res) => {
  try {
    const pr = await PullRequest.findById(req.params.pullRequestId);
    if (!pr) {
      return res.status(404).json({ message: "Pull request not found" });
    }

    const { error } = await checkProjectAccess(
      pr.project,
      req.user.id
    );
    if (error) {
      return res.status(403).json({ message: error });
    }

    if (pr.status !== "open") {
      return res.status(400).json({
        message: "Pull request already handled",
      });
    }

    pr.status = "rejected";
    await pr.save();

    await Notification.create({
      receiver: pr.createdBy,
      sender: req.user.id,
      project: pr.project,
      type: "PR_REJECTED",
      message: `Your pull request "${pr.title}" was rejected`,
      data: { pullRequestId: pr._id },
    });

    res.status(200).json({ message: "Pull request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
