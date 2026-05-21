import mongoose from "mongoose";

const projectStateSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },

        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        version: Number,

        state: {
            type: Object,
        },

        message: String,
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "ProjectState",
    projectStateSchema
);