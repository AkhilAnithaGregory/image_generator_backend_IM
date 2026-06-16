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

router.post("/projects/:projectId/invites", authMiddleware, sendInvite);
router.post("/invites/:inviteId/accept", authMiddleware, acceptInvite);
router.post("/invites/:inviteId/reject", authMiddleware, rejectInvite);
router.delete("/invites/:inviteId", authMiddleware, cancelInvite);
router.get("/invites", authMiddleware, getMyInvites);
router.delete("/projects/:projectId/collaborators/:collaboratorId", authMiddleware, removeCollaborator);
router.get("/projects/:projectId/collaborators", authMiddleware, getProjectCollaborators);

export default router;