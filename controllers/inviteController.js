import Invite from "../models/Invite.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Branch from "../models/Branch.js";

export const sendInvite = async (
    req,
    res
) => {
    try {
        const { projectId } = req.params;

        const { email } = req.body;

        // find project
        const project =
            await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        // only owner can invite
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        // find target user
        const targetUser =
            await User.findOne({ email });

        if (!targetUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // cannot invite self
        if (
            targetUser._id.toString() ===
            req.user.id
        ) {
            return res.status(400).json({
                message:
                    "You cannot invite yourself",
            });
        }

        const alreadyMember =
            project.owner.toString() === targetUser._id.toString() ||
            project.collaborators.some(
                (c) => c.user.toString() === targetUser._id.toString()
            );

        if (alreadyMember) {
            return res.status(400).json({
                message: "User already in project",
            });
        }


        // check existing invite
        const existingInvite =
            await Invite.findOne({
                project: projectId,
                toUser: targetUser._id,
                status: "pending",
            });

        if (existingInvite) {
            return res.status(400).json({
                message:
                    "Invite already sent",
            });
        }

        // create invite
        const invite = await Invite.create({
            project: projectId,

            fromUser: req.user.id,

            toUser: targetUser._id,
        });

        res.status(201).json({
            message:
                "Invite sent successfully",

            invite,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
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

        // ✅ only invited user
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

        // ✅ mark accepted
        invite.status = "accepted";
        await invite.save();

        const project = await Project.findById(invite.project);

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        // ✅ add collaborator safely
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

        // ✅ create personal branch (only if not exists)
        const existingBranch = await Branch.findOne({
            project: project._id,
            owner: req.user.id,
            isMain: false,
        });

        if (!existingBranch) {
            const branchName = `user-${req.user.id}-branch`;

            await Branch.create({
                name: branchName,
                project: project._id,
                owner: req.user.id,
                isMain: false,
            });
        }

        res.status(200).json({
            message: "Invite accepted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const rejectInvite = async (
    req,
    res
) => {
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

        // only invited user
        if (
            invite.toUser.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        // already handled
        if (invite.status !== "pending") {
            return res.status(400).json({
                message:
                    "Invite already handled",
            });
        }

        invite.status = "rejected";

        await invite.save();

        res.status(200).json({
            message:
                "Invite rejected successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};
export const getMyInvites = async (
    req,
    res
) => {
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
export const cancelInvite = async (
    req,
    res
) => {
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

        // find project
        const project =
            await Project.findById(
                invite.project
            );

        if (!project) {
            return res.status(404).json({
                message: "Project not found",
            });
        }

        // owner only
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message: "Unauthorized",
            });
        }

        // only pending invites
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
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};
export const removeCollaborator = async (req, res) => {
    try {
        const {
            projectId,
            collaboratorId,
        } = req.params;

        const project =
            await Project.findById(
                projectId
            );

        if (!project) {
            return res.status(404).json({
                message:
                    "Project not found",
            });
        }

        // owner only
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }

        // cannot remove owner
        if (
            collaboratorId ===
            req.user.id
        ) {
            return res.status(400).json({
                message:
                    "Owner cannot remove themselves",
            });
        }

        // remove collaborator
        project.collaborators =
            project.collaborators.filter(
                (c) =>
                    c.user.toString() !==
                    collaboratorId
            );

        await project.save();

        // delete collaborator branches
        await Branch.deleteMany({
            project: projectId,
            owner: collaboratorId,
            isMain: false,
        });

        res.status(200).json({
            message:
                "Collaborator removed successfully",
        });
    } catch (error) {
        console.log(error);

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

        // access check
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
        console.log(error);

        res.status(500).json({
            message: error.message,
        });
    }
};