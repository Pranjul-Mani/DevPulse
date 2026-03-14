import mongoose from "mongoose";

const repoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    githubUrl: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    defaultBranch: {
      type: String,
      default: "main",
    },
    isIndexed: {
      type: Boolean,
      default: false,
    },
    indexedAt: {
      type: Date,
      default: null,
    },
    fileTree: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

repoSchema.index({ userId: 1 });
repoSchema.index({ fullName: 1 });

const Repo = mongoose.model("Repo", repoSchema);
export default Repo;
