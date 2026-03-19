import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Commit from "../models/Commit.js";
import Repo from "../models/Repo.js";
import { fetchCommitDiff, fetchOpenPRsWithCommits } from "../services/githubService.js";
import { summarizeCommit } from "../services/groqService.js";

const router = Router();

// Get commits that belong to currently open PRs
router.get("/:repoId/open-prs", authenticate, async (req, res, next) => {
  try {
    const { repoId } = req.params;

    const repo = await Repo.findOne({
      _id: repoId,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) return res.status(404).json({ error: "Repo not found" });

    const token = req.user.githubToken;
    if (!token) return res.status(400).json({ error: "GitHub token required" });

    // Fetch open PRs + their commit SHAs from GitHub
    const openPRs = await fetchOpenPRsWithCommits(token, repo.owner, repo.name);

    if (!openPRs.length) return res.json({ commits: [], openPRs: [] });

    // Collect all unique SHAs across all open PRs
    const allShas = [...new Set(openPRs.flatMap((pr) => pr.commitShas))];

    // Find matching commits stored in DB (which may already have aiSummary)
    const commits = await Commit.find({ repoId, sha: { $in: allShas } }).sort({ timestamp: -1 });

    // Attach PR metadata to each commit
    const shaTopr = {};
    for (const pr of openPRs) {
      for (const sha of pr.commitShas) {
        shaTopr[sha] = { prNumber: pr.prNumber, prTitle: pr.prTitle, prAuthor: pr.prAuthor };
      }
    }

    const enrichedCommits = commits.map((c) => ({
      ...c.toObject(),
      pr: shaTopr[c.sha] || null,
    }));

    res.json({ commits: enrichedCommits, openPRs });
  } catch (error) {
    next(error);
  }
});

// Get commits for a repo (full history)
router.get("/:repoId", authenticate, async (req, res, next) => {
  try {
    const { repoId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const repo = await Repo.findOne({
      _id: repoId,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const commits = await Commit.find({ repoId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Commit.countDocuments({ repoId });

    res.json({
      commits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Manually summarize a commit
router.post("/:repoId/summarize/:sha", authenticate, async (req, res, next) => {
  try {
    const { repoId, sha } = req.params;

    const repo = await Repo.findOne({
      _id: repoId,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found" });
    }

    const token = req.user.githubToken;
    if (!token) {
      return res.status(400).json({ error: "GitHub token required" });
    }

    const commitData = await fetchCommitDiff(token, repo.owner, repo.name, sha);
    const aiSummary = await summarizeCommit(commitData.diff, commitData.message);

    const commit = await Commit.findOneAndUpdate(
      { sha },
      {
        repoId,
        sha: commitData.sha,
        message: commitData.message,
        aiSummary,
        author: commitData.author,
        timestamp: commitData.timestamp,
        filesChanged: commitData.files,
      },
      { upsert: true, new: true }
    );

    res.json({ commit });
  } catch (error) {
    next(error);
  }
});

export default router;
