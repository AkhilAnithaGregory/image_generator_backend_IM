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
      enum: ["open", "accepted", "rejected", "merged"],
      default: "open",
    },

    baseVersion: {
      type: Number,
      required: true,
    },

    mergedAt: Date,

    mergedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

pullRequestSchema.index({ project: 1, status: 1 });
pullRequestSchema.index({ fromBranch: 1, toBranch: 1 });

export default mongoose.model("PullRequest", pullRequestSchema);