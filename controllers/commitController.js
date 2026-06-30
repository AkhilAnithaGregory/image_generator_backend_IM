import Commit from "../models/Commit.js";
import Branch from "../models/Branch.js";
import { checkProjectAccess } from "../helper/projectHelper.js";

export const commitChanges = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { state, message, lastKnownVersion } = req.body;

    if (!state) {
      return res.status(400).json({
        message: "State is required",
      });
    }

    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    const { error } = await checkProjectAccess(
      branch.project,
      req.user.id
    );
    if (error) return res.status(403).json({ message: error });

    const latestCommit = await Commit.findOne({
      branch: branchId,
    }).sort({ version: -1 });

    if (
      latestCommit &&
      lastKnownVersion !== undefined &&
      latestCommit.version !== lastKnownVersion
    ) {
      return res.status(409).json({
        message: "Outdated branch. Pull latest changes.",
        latestVersion: latestCommit.version,
      });
    }

    const nextVersion = latestCommit
      ? latestCommit.version + 1
      : 1;

    const commit = await Commit.create({
      project: branch.project,
      branch: branchId,
      createdBy: req.user.id,
      version: nextVersion,
      message: message || `Commit v${nextVersion}`,
      state,
    });

    branch.version = nextVersion;
    branch.latestCommit = commit._id;
    await branch.save();

    res.status(201).json({
      message: "Commit successful",
      commit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getCommits = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    const { error } = await checkProjectAccess(
      branch.project,
      req.user.id
    );
    if (error) return res.status(403).json({ message: error });

    const commits = await Commit.find({ branch: branchId })
      .sort({ version: -1 })
      .populate("createdBy", "username email");

    res.status(200).json(commits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getSingleCommit = async (req, res) => {
  try {
    const commit = await Commit.findById(
      req.params.commitId
    ).populate("createdBy", "username email");

    if (!commit) {
      return res.status(404).json({
        message: "Commit not found",
      });
    }

    const { error } = await checkProjectAccess(
      commit.project,
      req.user.id
    );
    if (error) return res.status(403).json({ message: error });

    res.status(200).json(commit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteCommit = async (req, res) => {
  try {
    const commit = await Commit.findById(
      req.params.commitId
    );

    if (!commit) {
      return res.status(404).json({
        message: "Commit not found",
      });
    }

    const { error } = await checkProjectAccess(
      commit.project,
      req.user.id
    );
    if (error) return res.status(403).json({ message: error });

    if (commit.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await commit.deleteOne();

    res.status(200).json({
      message: "Commit deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const pullLatest = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    const { error } = await checkProjectAccess(
      branch.project,
      req.user.id
    );
    if (error) return res.status(403).json({ message: error });

    const latestCommit = await Commit.findOne({
      branch: branchId,
    }).sort({ version: -1 });

    if (!latestCommit) {
      return res.status(404).json({
        message: "No commits found",
      });
    }

    res.status(200).json({
      state: latestCommit.state,
      version: latestCommit.version,
      commit: latestCommit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const revertToCommit = async (req, res) => {
  try {
    const { commitId } = req.params;

    const commit = await Commit.findById(commitId);

    if (!commit) {
      return res.status(404).json({
        message: "Commit not found",
      });
    }

    const { error } = await checkProjectAccess(
      commit.project,
      req.user.id
    );
    if (error) return res.status(403).json({ message: error });

    const branch = await Branch.findById(commit.branch);

    const latestCommit = await Commit.findOne({
      branch: commit.branch,
    }).sort({ version: -1 });

    const nextVersion = latestCommit
      ? latestCommit.version + 1
      : 1;

    const newCommit = await Commit.create({
      project: commit.project,
      branch: commit.branch,
      createdBy: req.user.id,
      version: nextVersion,
      message: `Reverted to v${commit.version}`,
      state: commit.state,
    });

    branch.version = nextVersion;
    branch.latestCommit = newCommit._id;
    await branch.save();

    res.status(200).json({
      message: "Reverted successfully",
      commit: newCommit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};