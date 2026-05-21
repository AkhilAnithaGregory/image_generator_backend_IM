import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
    sendInvite,
    acceptInvite,
    rejectInvite,
    getMyInvites,
    cancelInvite,
    removeCollaborator,
    getProjectCollaborators,
} from "../controllers/inviteController.js";

const router = express.Router();


// SEND INVITE
router.post(
    "/projects/:projectId/invite",
    authMiddleware,
    sendInvite
);


// ACCEPT INVITE
router.post(
    "/invites/:inviteId/accept",
    authMiddleware,
    acceptInvite
);


// REJECT INVITE
router.post(
    "/invites/:inviteId/reject",
    authMiddleware,
    rejectInvite
);


// CANCEL INVITE
router.delete(
    "/invites/:inviteId/cancel",
    authMiddleware,
    cancelInvite
);


// GET MY INVITES
router.get(
    "/invites",
    authMiddleware,
    getMyInvites
);


// REMOVE COLLABORATOR
router.delete(
    "/projects/:projectId/collaborators/:collaboratorId",
    authMiddleware,
    removeCollaborator
);


// GET PROJECT COLLABORATORS
router.get(
    "/projects/:projectId/collaborators",
    authMiddleware,
    getProjectCollaborators
);

export default router;