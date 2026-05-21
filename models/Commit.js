import mongoose from "mongoose";

const commitSchema =
    new mongoose.Schema(
        {
            project: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Project",

                required: true,
            },

            branch: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Branch",

                required: true,
            },

            createdBy: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true,
            },

            version: {
                type: Number,
                required: true,
            },

            message: {
                type: String,
                default:
                    "Updated project",
            },

            // FULL REACT FLOW STATE
            state: {
                images: {
                    type: Array,
                    default: [],
                },

                nodes: {
                    type: Array,
                    default: [],
                },

                edges: {
                    type: Array,
                    default: [],
                },

                selectedNodeId: {
                    type: String,
                    default: null,
                },

                viewport: {
                    x: {
                        type: Number,
                        default: 0,
                    },

                    y: {
                        type: Number,
                        default: 0,
                    },

                    zoom: {
                        type: Number,
                        default: 1,
                    },
                },
            },

            // generated image
            generatedImage: {
                type: String,
                default: "",
            },

            // prompt
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
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",
            },
        },
        {
            timestamps: true,
        }
    );



// index
commitSchema.index({
    branch: 1,
    version: -1,
});

export default mongoose.model(
    "Commit",
    commitSchema
);