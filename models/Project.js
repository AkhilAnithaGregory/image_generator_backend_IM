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


/* Find projects owned by user */
projectSchema.index({ owner: 1 });

/* Find projects where user is collaborator */
projectSchema.index({ "collaborators.user": 1 });

/* Public project search */
projectSchema.index({ visibility: 1, name: 1 });

/* Fork tree / attribution */
projectSchema.index({ forkedFrom: 1 });

export default mongoose.model("Project", projectSchema);