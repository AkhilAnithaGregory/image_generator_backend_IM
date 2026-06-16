import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        collaborators: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },

                role: {
                    type: String,
                    default: "editor",
                },
            },
        ],

        liveBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
        },
    },
    {
        timestamps: true,
    }
);

projectSchema.index({
    _id: 1,
    "collaborators.user": 1
});

export default mongoose.model(
    "Project",
    projectSchema
);