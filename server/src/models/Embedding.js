import mongoose from "mongoose";

const embeddingSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    metadata: {
      language: String,
      startLine: Number,
      endLine: Number,
      functionName: String,
    },
  },
  { timestamps: true }
);

embeddingSchema.index({ repoId: 1 });
embeddingSchema.index({ repoId: 1, filePath: 1 });

const Embedding = mongoose.model("Embedding", embeddingSchema);
export default Embedding;
