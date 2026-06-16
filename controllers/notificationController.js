import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const notifications =
            await Notification.find({
                receiver:
                    req.user.id,
            })
                .populate(
                    "sender",
                    "username email"
                )
                .populate(
                    "project",
                    "name"
                )
                .sort({
                    createdAt: -1,
                });

        res.status(200).json(
            notifications
        );
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                error.message,
        });
    }
};
export const getSingleNotification = async (req, res) => {
    try {
        const notification =
            await Notification.findById(
                req.params.notificationId
            )
                .populate(
                    "sender",
                    "username email"
                )
                .populate(
                    "project",
                    "name"
                );

        if (!notification) {
            return res.status(404).json({
                message:
                    "Notification not found",
            });
        }

        // access check
        if (
            notification.receiver.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }

        res.status(200).json(
            notification
        );
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                error.message,
        });
    }
};
export const markAsRead = async (req, res) => {
    try {
        const notification =
            await Notification.findById(
                req.params.notificationId
            );

        if (!notification) {
            return res.status(404).json({
                message:
                    "Notification not found",
            });
        }

        // owner check
        if (
            notification.receiver.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }

        notification.isRead = true;

        await notification.save();

        res.status(200).json({
            message:
                "Notification marked as read",

            notification,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                error.message,
        });
    }
};
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                receiver:
                    req.user.id,

                isRead: false,
            },
            {
                isRead: true,
            }
        );

        res.status(200).json({
            message:
                "All notifications marked as read",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                error.message,
        });
    }
};
export const deleteNotification = async (req, res) => {
    try {
        const notification =
            await Notification.findById(
                req.params.notificationId
            );

        if (!notification) {
            return res.status(404).json({
                message:
                    "Notification not found",
            });
        }

        // owner check
        if (
            notification.receiver.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    "Unauthorized",
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            message:
                "Notification deleted successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                error.message,
        });
    }
};
export const deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({
            receiver:
                req.user.id,
        });

        res.status(200).json({
            message:
                "All notifications deleted successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                error.message,
        });
    }
};
export const getUnreadCount = async (req, res) => {
    try {
        const count =
            await Notification.countDocuments(
                {
                    receiver:
                        req.user.id,

                    isRead: false,
                }
            );

        res.status(200).json({
            unreadCount: count,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message:
                error.message,
        });
    }
};