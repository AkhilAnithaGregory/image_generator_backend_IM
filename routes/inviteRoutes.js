import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as invite from "../controllers/inviteController.js";

const router = express.Router();

router.post("/:projectId", authMiddleware, invite.sendInvite);
router.post("/accept/:inviteId", authMiddleware, invite.acceptInvite);
router.post("/reject/:inviteId", authMiddleware, invite.rejectInvite);
router.delete("/invites/:inviteId", authMiddleware, invite.cancelInvite);
router.get("/invites", authMiddleware, invite.getMyInvites);
router.delete("/remove_collaborator/:projectId/id/:collaboratorId", authMiddleware, invite.removeCollaborator);
router.get("/project_collaborators/:projectId", authMiddleware, invite.getProjectCollaborators);

export default router;