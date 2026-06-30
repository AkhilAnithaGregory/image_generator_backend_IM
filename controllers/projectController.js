import Project from "../models/Project.js";
import Branch from "../models/Branch.js";
import Commit from "../models/Commit.js";
import Invite from "../models/Invite.js";
import PullRequest from "../models/PullRequest.js";

export const createProject = async (req, res) => {
    try {
        const { name } = req.body;

        const project = await Project.create({
            name,
            owner: req.user.id,
        });

        const mainBranch = await Branch.create({
            name: "main",
            project: project._id,
            owner: req.user.id,
            isMain: true,
        });

        project.liveBranch = mainBranch._id;

        await project.save();

        await Commit.create({
            project: project._id,
            branch: mainBranch._id,
            createdBy: req.user.id,
            version: 1,
            message: "Initial commit",
            state: {
                images: [],
                nodes: [],
                edges: []
            }
        });

        mainBranch.version = 1;
        await mainBranch.save();

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getProjects = async (req, res) => {
    try {
        const projects =
            await Project.find({
                $or: [
                    {
                        owner: req.user.id,
                    },

                    {
                        "collaborators.user":
                            req.user.id,
                    },
                ],
            })
                .populate(
                    "owner",
                    "username email"
                )
                .sort({
                    createdAt: -1,
                });

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getSingleProject = async (req, res) => {
    try {
        const project =
            await Project.findById(
                req.params.projectId
            )
                .populate(
                    "owner",
                    "username email"
                )
                .populate(
                    "collaborators.user",
                    "username email"
                );

        if (!project) {
            return res.status(404).json({
                message:
                    "Project not found",
            });
        }
        const isOwner =
            project.owner._id.toString() ===
            req.user.id;

        const isCollaborator =
            project.collaborators.some(
                (c) =>
                    c.user._id.toString() ===
                    req.user.id
            );

        if (
            !isOwner &&
            !isCollaborator
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }
        const branches =
            await Branch.find({
                project:
                    project._id,
            });

        res.status(200).json({
            project,
            branches,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const updateProject = async (req, res) => {
    try {
        const { name, visibility } = req.body;

        if (!name && !visibility) {
            return res.status(400).json({
                message: "Nothing to update",
            });
        }

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

        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }


        if (name) project.name = name;
        if (visibility) project.visibility = visibility;


        await project.save();

        res.status(200).json({
            message:
                "Project updated successfully",

            project,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const deleteProject = async (req, res) => {
    try {
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
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }
        await Branch.deleteMany({
            project:
                project._id,
        });

        await Commit.deleteMany({
            project:
                project._id,
        });

        await Invite.deleteMany({
            project:
                project._id,
        });

        await PullRequest.deleteMany({
            project:
                project._id,
        });
        await project.deleteOne();

        res.status(200).json({
            message:
                "Project deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getPublicProjects = async (req, res) => {
    try {
        const search = req.query.search || "";

        const projects = await Project.find({
            visibility: "public",
            name: { $regex: search, $options: "i" },
        })
            .populate("owner", "username email")
            .sort({ createdAt: -1 });

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const forkProject = async (req, res) => {
    try {
        const original = await Project.findById(req.params.projectId);

        if (!original || original.visibility !== "public") {
            return res.status(403).json({
                message: "Project cannot be forked",
            });
        }

        const sourceBranch = await Branch.findById(original.liveBranch);

        const sourceCommit = await Commit.findOne({
            branch: sourceBranch._id,
        }).sort({ version: -1 });

        const newProject = await Project.create({
            name: `${original.name} (Fork)`,
            owner: req.user.id,
            visibility: "private",
            forkedFrom: original._id,
        });

        const newBranch = await Branch.create({
            name: "main",
            project: newProject._id,
            owner: req.user.id,
            isMain: true,
        });

        newProject.liveBranch = newBranch._id;
        await newProject.save();

        await Commit.create({
            project: newProject._id,
            branch: newBranch._id,
            createdBy: req.user.id,
            version: 1,
            message: "Forked from public project",
            state: sourceCommit?.state || {
                images: [],
                nodes: [],
                edges: [],
            },
        });

        newBranch.version = 1;
        await newBranch.save();

        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};