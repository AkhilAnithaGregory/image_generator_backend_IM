import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },

        type: {
            type: String,

            enum: [
                "PROJECT_INVITE",
                "PULL_REQUEST",
                "PR_ACCEPTED",
                "PR_REJECTED",
                "PROJECT_ACCEPTED",
                "PROJECT_REJECTED",
                "MERGE_COMPLETED",
            ],
        },

        message: String,

        data: {
            type: Object,
            default: {},
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({
  receiver: 1,
  isRead: 1
});

export default mongoose.model(
    "Notification",
    notificationSchema
);