import mongoose from "mongoose";

const commitSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
    },
    sha: {
      type: String,
      required: true,
      unique: true,
    },
    message: {
      type: String,
      required: true,
    },
    aiSummary: {
      type: String,
      default: null,
    },
    author: {
      name: String,
      email: String,
      avatar: String,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    filesChanged: [
      {
        filename: String,
        status: String,
        additions: Number,
        deletions: Number,
        patch: String,
      },
    ],
  },
  { timestamps: true }
);

commitSchema.index({ repoId: 1, timestamp: -1 });

const Commit = mongoose.model("Commit", commitSchema);
export default Commit;
