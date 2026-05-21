import mongoose from "mongoose";

const pullRequestSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        fromBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
        },

        toBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            default: "",
        },

        status: {
            type: String,

            enum: [
                "open",
                "accepted",
                "rejected",
                "merged",
            ],

            default: "open",
        },

        // optional conflict detection
        baseVersion: {
            type: Number,
            default: 1,
        },

        mergedAt: {
            type: Date,
        },

        mergedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "PullRequest",
    pullRequestSchema
);