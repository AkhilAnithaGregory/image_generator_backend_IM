import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    getNotifications,
    getSingleNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    getUnreadCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/notifications", authMiddleware, getNotifications);
router.get("/notifications/unread/count", authMiddleware, getUnreadCount);
router.get("/notifications/:notificationId", authMiddleware, getSingleNotification);
router.put("/notifications/:notificationId/read", authMiddleware, markAsRead);
router.put("/notifications/read/all", authMiddleware, markAllAsRead);
router.delete("/notifications/:notificationId", authMiddleware, deleteNotification);
router.delete("/notifications", authMiddleware, deleteAllNotifications);

export default router;