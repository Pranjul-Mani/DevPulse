import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Repo from "../models/Repo.js";
import { fetchPRData } from "../services/githubService.js";
import { summarizePR } from "../services/groqService.js";

const router = Router();

// Summarize a PR
router.post("/summarize", authenticate, async (req, res, next) => {
  try {
    const { repoId, prNumber } = req.body;

    if (!repoId || !prNumber) {
      return res.status(400).json({ error: "repoId and prNumber are required" });
    }

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

    const prData = await fetchPRData(token, repo.owner, repo.name, parseInt(prNumber));
    const summary = await summarizePR(prData);

    res.json({
      pr: {
        title: prData.title,
        state: prData.state,
        user: prData.user,
        filesChanged: prData.filesChanged,
        additions: prData.additions,
        deletions: prData.deletions,
      },
      summary,
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: "PR not found" });
    }
    next(error);
  }
});

export default router;
