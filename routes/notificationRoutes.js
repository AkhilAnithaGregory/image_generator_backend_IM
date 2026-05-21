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


// GET ALL NOTIFICATIONS
router.get(
    "/notifications",
    authMiddleware,
    getNotifications
);


// GET SINGLE NOTIFICATION
router.get(
    "/notifications/:notificationId",
    authMiddleware,
    getSingleNotification
);


// GET UNREAD COUNT
router.get(
    "/notifications/unread/count",
    authMiddleware,
    getUnreadCount
);


// MARK SINGLE AS READ
router.put(
    "/notifications/:notificationId/read",
    authMiddleware,
    markAsRead
);


// MARK ALL AS READ
router.put(
    "/notifications/read/all",
    authMiddleware,
    markAllAsRead
);


// DELETE SINGLE NOTIFICATION
router.delete(
    "/notifications/:notificationId",
    authMiddleware,
    deleteNotification
);


// DELETE ALL NOTIFICATIONS
router.delete(
    "/notifications/delete/all",
    authMiddleware,
    deleteAllNotifications
);

export default router;