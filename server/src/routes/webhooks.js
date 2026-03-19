import { Router } from "express";
import { verifyWebhookSignature } from "../middleware/webhookVerify.js";
import Repo from "../models/Repo.js";
import Commit from "../models/Commit.js";
import { fetchCommitDiff } from "../services/githubService.js";
import { summarizeCommit } from "../services/groqService.js";

const router = Router();

// GitHub webhook handler (push + pull_request)
router.post("/github", verifyWebhookSignature, async (req, res, next) => {
  try {
    const event = req.headers["x-github-event"];

    // ── Pull Request events ──────────────────────────────────────────────────
    if (event === "pull_request") {
      const { action, pull_request, repository } = req.body;
      const fullName = repository.full_name;

      const repo = await Repo.findOne({ fullName });
      if (!repo) return res.status(200).json({ message: "Repo not tracked" });

      const io = req.app.get("io");

      if (action === "opened" || action === "reopened" || action === "synchronize") {
        // Emit the PR info so the frontend can refetch open-PR commits
        if (io) {
          io.to(`repo:${repo._id}`).emit("pr:opened", {
            prNumber: pull_request.number,
            prTitle: pull_request.title,
            prAuthor: pull_request.user?.login,
          });
        }
      } else if (action === "closed") {
        // Emit closed event so the frontend can remove those commits from view
        if (io) {
          io.to(`repo:${repo._id}`).emit("pr:closed", {
            prNumber: pull_request.number,
          });
        }
      }

      return res.status(200).json({ message: "PR event processed" });
    }

    // ── Push events ─────────────────────────────────────────────────────────
    if (event !== "push") {
      return res.status(200).json({ message: "Event ignored" });
    }

    const { repository, commits, ref } = req.body;
    const fullName = repository.full_name;

    const repo = await Repo.findOne({ fullName });
    if (!repo) {
      return res.status(200).json({ message: "Repo not tracked" });
    }

    // Get the owner's GitHub token
    const User = (await import("../models/User.js")).default;
    const owner = await User.findById(repo.userId);
    const token = owner?.githubToken;

    if (!token) {
      return res.status(200).json({ message: "No GitHub token for repo owner" });
    }

    const io = req.app.get("io");

    // Process each commit
    for (const commitInfo of commits || []) {
      try {
        const commitData = await fetchCommitDiff(
          token,
          repo.owner,
          repo.name,
          commitInfo.id
        );

        const aiSummary = await summarizeCommit(
          commitData.diff,
          commitData.message
        );

        const commit = await Commit.findOneAndUpdate(
          { sha: commitInfo.id },
          {
            repoId: repo._id,
            sha: commitData.sha,
            message: commitData.message,
            aiSummary,
            author: commitData.author,
            timestamp: commitData.timestamp,
            filesChanged: commitData.files,
          },
          { upsert: true, new: true }
        );

        // Push to frontend via Socket.io
        if (io) {
          io.to(`repo:${repo._id}`).emit("commit:new", commit);
        }
      } catch (err) {
        console.error(`Error processing commit ${commitInfo.id}:`, err.message);
      }
    }

    res.status(200).json({ message: "Webhook processed" });
  } catch (error) {
    next(error);
  }
});

export default router;
