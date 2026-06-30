import mongoose from "mongoose";

const commitSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        version: {
            type: Number,
            required: true,
        },

        message: {
            type: String,
            default: "Updated project",
        },

        state: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        generatedImage: {
            type: String,
            default: "",
        },

        prompt: {
            type: String,
            default: "",
        },

        isMerged: {
            type: Boolean,
            default: false,
        },

        mergedAt: Date,

        mergedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

commitSchema.index(
    { branch: 1, version: 1 },
    { unique: true }
);

export default mongoose.model(
    "Commit",
    commitSchema
);