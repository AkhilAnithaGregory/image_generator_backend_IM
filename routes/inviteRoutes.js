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

router.post("/:projectId", authMiddleware, sendInvite);
router.post("/accept/:inviteId", authMiddleware, acceptInvite);
router.post("/reject/:inviteId", authMiddleware, rejectInvite);
router.delete("/invites/:inviteId", authMiddleware, cancelInvite);
router.get("/invites", authMiddleware, getMyInvites);
router.delete("/remove_collaborator/:projectId/id/:collaboratorId", authMiddleware, removeCollaborator);
router.get("/project_collaborators/:projectId", authMiddleware, getProjectCollaborators);

export default router;