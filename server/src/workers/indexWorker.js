import { Queue, Worker } from "bullmq";
import getRedis from "../config/redis.js";
import { fetchAllFiles } from "../services/githubService.js";
import { indexRepository } from "../services/ragService.js";
import Repo from "../models/Repo.js";
import User from "../models/User.js";

let indexQueue;

export const getIndexQueue = () => {
  if (!indexQueue) {
    indexQueue = new Queue("repo-indexing", {
      connection: getRedis(),
    });
  }
  return indexQueue;
};

export const startIndexWorker = () => {
  const worker = new Worker(
    "repo-indexing",
    async (job) => {
      const { repoId, userId } = job.data;

      try {
        console.log(`Indexing repo ${repoId}...`);

        const repo = await Repo.findById(repoId);
        if (!repo) throw new Error("Repo not found");

        const user = await User.findById(userId);
        if (!user?.githubToken) throw new Error("No GitHub token");

        const files = await fetchAllFiles(
          user.githubToken,
          repo.owner,
          repo.name,
          repo.defaultBranch
        );

        const chunkCount = await indexRepository(repo._id, files);

        repo.isIndexed = true;
        repo.indexedAt = new Date();
        await repo.save();

        console.log(`Indexed repo ${repoId}: ${chunkCount} chunks from ${files.length} files`);

        return { chunkCount, filesProcessed: files.length };
      } catch (error) {
        console.error(`Indexing failed for repo ${repoId}:`, error.message);
        throw error;
      }
    },
    {
      connection: getRedis(),
      concurrency: 2,
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });

  worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
  });

  return worker;
};
