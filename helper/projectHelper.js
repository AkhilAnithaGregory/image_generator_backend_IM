import Project from "../models/Project.js";

export const checkProjectAccess = async (projectId, userId) => {
    const project = await Project.findById(projectId);

    if (!project) {
        return { error: "Project not found" };
    }

    const isOwner = project.owner.toString() === userId;

    const isCollaborator = project.collaborators.some(
        (c) => c.user.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
        return { error: "Unauthorized" };
    }

    return { project };
};