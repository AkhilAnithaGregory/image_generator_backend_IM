import Branch from "../models/Branch.js";
import Commit from "../models/Commit.js";
import { checkProjectAccess } from "../helper/projectHelper.js";

export const getBranches = async (req, res) => {
  try {
    const { projectId } = req.params;

    const { error } = await checkProjectAccess(projectId, req.user.id);
    if (error) return res.status(403).json({ message: error });

    const branches = await Branch.find({ project: projectId })
      .populate("owner", "username email")
      .sort({ createdAt: 1 });

    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const createBranch = async (req, res) => {
  try {
    const { name, fromBranchId } = req.body;
    const { projectId } = req.params;

    const branch = await Branch.create({
      name,
      project: projectId,
      owner: req.user.id,
      isMain: false,
    });

    if (fromBranchId) {
      const sourceCommit = await Commit.findOne({
        branch: fromBranchId,
      }).sort({ version: -1 });

      if (sourceCommit) {
        const newCommit = await Commit.create({
          project: projectId,
          branch: branch._id,
          createdBy: req.user.id,
          version: 1,
          message: `Initial commit from branch clone`,
          state: sourceCommit.state,
          generatedImage: sourceCommit.generatedImage,
          prompt: sourceCommit.prompt,
        });

        branch.latestCommit = newCommit._id;
        branch.version = 1;
        await branch.save();
      }
    }

    res.status(201).json({ branch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteBranch = async (req, res) => {
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

    if (branch.isMain) {
      return res.status(400).json({
        message: "Cannot delete main branch",
      });
    }

    await Commit.deleteMany({ branch: branch._id });
    await branch.deleteOne();

    res.status(200).json({
      message: "Branch deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};