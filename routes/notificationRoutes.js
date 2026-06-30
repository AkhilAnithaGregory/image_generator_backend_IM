import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as notify from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, notify.getNotifications);
router.get("/notifications/unread/count", authMiddleware, notify.getUnreadCount);
router.get("/notifications/:notificationId", authMiddleware, notify.getSingleNotification);
router.put("/:notificationId/read", authMiddleware, notify.markAsRead);
router.put("/read/all", authMiddleware, notify.markAllAsRead);
router.delete("/notifications/:notificationId", authMiddleware, notify.deleteNotification);
router.delete("/notifications", authMiddleware, notify.deleteAllNotifications);

export default router;