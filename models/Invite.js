import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },

        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        toUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected",
            ],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "Invite",
    inviteSchema
);