import mongoose from "mongoose";

const branchSchema =
    new mongoose.Schema(
        {
            name: {
                type: String,
                required: true,
                trim: true,
            },

            project: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Project",

                required: true,
            },

            owner: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true,
            },

            isMain: {
                type: Boolean,
                default: false,
            },

            version: {
                type: Number,
                default: 1,
            },

            latestCommit: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Commit",
            },

            status: {
                type: String,

                enum: [
                    "active",
                    "merged",
                    "deleted",
                ],

                default: "active",
            },
        },
        {
            timestamps: true,
        }
    );



// unique branch name per project
branchSchema.index({
    project: 1,
    name: 1,
}, {
    unique: true,
});

export default mongoose.model(
    "Branch",
    branchSchema
);