import Invite from "../models/Invite.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Branch from "../models/Branch.js";
import Notification from "../models/Notification.js";

export const sendInvite = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { email } = req.body;
        const senderUser = await User.findById(req.user.id);

        if (!senderUser) {
            return res.status(401).json({
                message: "Invalid user session",
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (targetUser._id.toString() === req.user.id) {
            return res.status(400).json({
                message: "You cannot invite yourself",
            });
        }

        const alreadyCollaborator =
            project.owner.toString() === targetUser._id.toString() ||
            project.collaborators.some(
                (c) => c.user.toString() === targetUser._id.toString()
            );

        if (alreadyCollaborator) {
            return res.status(400).json({
                message: "User is already a collaborator",
            });
        }

        let invite = await Invite.findOne({
            project: projectId,
            toUser: targetUser._id,
        });

        if (invite) {
            if (invite.status === "pending") {
                return res.status(400).json({
                    message: "Invite already sent and pending",
                });
            }
            if (invite.status === "accepted") {
                return res.status(400).json({
                    message: "User is already a collaborator",
                });
            }
            if (invite.status === "rejected") {
                invite.status = "pending";
                invite.fromUser = req.user.id;
                await invite.save();

                await Notification.create({
                    receiver: targetUser._id,
                    sender: req.user.id,
                    project: projectId,
                    type: "PROJECT_INVITE",
                    message: `${senderUser.username} invited you to collaborate`,
                    data: {
                        inviteId: invite._id,
                    },
                    isRead: false,
                });

                return res.status(200).json({
                    message: "Invite re-sent successfully",
                    invite,
                });
            }
        }
        invite = await Invite.create({
            project: projectId,
            fromUser: req.user.id,
            toUser: targetUser._id,
            status: "pending",
        });
        await Notification.create({
            receiver: targetUser._id,
            sender: req.user.id,
            project: projectId,
            type: "PROJECT_INVITE",
            message: `${senderUser.username} invited you to collaborate`,
            data: {
                inviteId: invite._id,
            },
            isRead: false,
        });

        res.status(201).json({
            message: "Invite sent successfully",
            invite,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Invite already exists for this user and project",
            });
        }

        res.status(500).json({
            message: error.message || "Internal server error",
        });
    }
};
export const acceptInvite = async (req, res) => {
    try {
        const invite = await Invite.findById(req.params.inviteId);

        if (!invite) {
            return res.status(404).json({
                message: "Invite not found",
            });
        }
        if (invite.toUser.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({
                message: "Invite already handled",
            });
        }
        invite.status = "accepted";
        await invite.save();

        const project = await Project.findById(invite.project);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }
        const alreadyCollaborator = project.collaborators.some(
            (c) => c.user.toString() === req.user.id
        );

        if (!alreadyCollaborator) {
            project.collaborators.push({
                user: req.user.id,
                role: "editor",
            });
            await project.save();
        }
        const existingBranch = await Branch.findOne({
            project: project._id,
            owner: req.user.id,
            isMain: false,
        });

        if (!existingBranch) {
            await Branch.create({
                name: `user-${req.user.id}-branch`,
                project: project._id,
                owner: req.user.id,
                isMain: false,
            });
        }
        await Notification.deleteMany({
            receiver: req.user.id,
            type: "PROJECT_INVITE",
            "data.inviteId": invite._id,
        });
        await Notification.create({
            receiver: req.user.id,
            sender: req.user.id,
            project: project._id,
            type: "PROJECT_ACCEPTED",
            message: `You accepted the invitation to ${project.name}`,
            isRead: false,
        });

        res.status(200).json({
            message: "Invite accepted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message,
        });
    }
};
export const rejectInvite = async (req, res) => {
    try {
        const invite = await Invite.findById(req.params.inviteId);

        if (!invite) {
            return res.status(404).json({
                message: "Invite not found",
            });
        }
        if (invite.toUser.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({
                message: "Invite already handled",
            });
        }
        invite.status = "rejected";
        await invite.save();

        const project = await Project.findById(invite.project);
        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        await Notification.deleteMany({
            receiver: req.user.id,
            type: "PROJECT_INVITE",
            "data.inviteId": invite._id,
        });
        await Notification.create({
            receiver: req.user.id,
            sender: req.user.id,
            project: project._id,
            type: "PROJECT_REJECTED",
            message: `You rejected the invitation to ${project.name}`,
            isRead: false,
        });

        res.status(200).json({
            message: "Invite rejected successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getMyInvites = async (req, res) => {
    try {
        const invites = await Invite.find({
            toUser: req.user.id,
            status: "pending",
        })
            .populate(
                "fromUser",
                "username email"
            )
            .populate(
                "project",
                "name"
            )
            .sort({
                createdAt: -1,
            });

        res.status(200).json(invites);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};
export const cancelInvite = async (req, res) => {
    try {
        const invite =
            await Invite.findById(
                req.params.inviteId
            );

        if (!invite) {
            return res.status(404).json({
                message: "Invite not found",
            });
        }
        const project =
            await Project.findById(
                invite.project
            );

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({
                message:
                    "Invite already handled",
            });
        }

        await invite.deleteOne();

        res.status(200).json({
            message:
                "Invite cancelled successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const removeCollaborator = async (req, res) => {
    try {
        const { projectId, collaboratorId } = req.params;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }
        if (collaboratorId === req.user.id) {
            return res.status(400).json({
                message: "Owner cannot remove themselves",
            });
        }
        project.collaborators = project.collaborators.filter(
            (c) => c.user.toString() !== collaboratorId
        );

        await project.save();
        await Branch.deleteMany({
            project: projectId,
            owner: collaboratorId,
            isMain: false,
        });
        await Invite.updateMany(
            {
                project: projectId,
                toUser: collaboratorId,
                status: { $in: ["accepted"] },
            },

            {
                status: "rejected",
            }
        );

        res.status(200).json({
            message: "Collaborator removed successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getProjectCollaborators = async (req, res) => {
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

        res.status(200).json({
            owner: project.owner,

            collaborators:
                project.collaborators,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};