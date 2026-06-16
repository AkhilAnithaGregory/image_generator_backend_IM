import Project from "../models/Project.js";
import Branch from "../models/Branch.js";
import Commit from "../models/Commit.js";
import Invite from "../models/Invite.js";
import PullRequest from "../models/PullRequest.js";

export const createProject = async (req, res) => {
    try {
        const { name } = req.body;

        // create project
        const project = await Project.create({
            name,
            owner: req.user.id,
        });

        // create main branch
        const mainBranch = await Branch.create({
            name: "main",
            project: project._id,
            owner: req.user.id,
            isMain: true,
        });

        project.liveBranch = mainBranch._id;

        await project.save();

        // initial empty state
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
        console.log(error);

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

        // ACCESS CHECK
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

        // branches
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
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};
export const updateProjectName = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message:
                    "Project name required",
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

        // owner check
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }

        project.name = name;

        await project.save();

        res.status(200).json({
            message:
                "Project updated successfully",

            project,
        });
    } catch (error) {
        console.log(error);

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

        // owner check
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }

        // delete related data
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


        // delete project
        await project.deleteOne();

        res.status(200).json({
            message:
                "Project deleted successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};