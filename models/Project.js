import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["editor", "viewer"],
          default: "editor",
        },
      },
    ],

    liveBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
      index: true,
    },

    forkedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ "collaborators.user": 1 });
projectSchema.index({ visibility: 1, name: 1 });

export default mongoose.model("Project", projectSchema);