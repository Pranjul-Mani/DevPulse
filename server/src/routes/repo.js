import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Repo from "../models/Repo.js";
import {
  fetchRepoInfo,
  fetchRepoTree,
  fetchFileContent,
  fetchAllFiles,
  buildFileTree,
} from "../services/githubService.js";
import { indexRepository } from "../services/ragService.js";

const router = Router();

// Connect a new repo
router.post("/connect", authenticate, async (req, res, next) => {
  try {
    const { githubUrl, githubToken } = req.body;

    if (!githubUrl) {
      return res.status(400).json({ error: "GitHub URL is required" });
    }

    const urlMatch = githubUrl.match(
      /github\.com\/([^/]+)\/([^/\s?.#]+)/
    );
    if (!urlMatch) {
      return res.status(400).json({ error: "Invalid GitHub URL" });
    }

    const owner = urlMatch[1];
    const repoName = urlMatch[2].replace(/\.git$/, "");

    // Save token if provided
    if (githubToken && req.user.githubToken !== githubToken) {
      req.user.githubToken = githubToken;
      await req.user.save();
    }

    const token = githubToken || req.user.githubToken;
    if (!token) {
      return res
        .status(400)
        .json({ error: "GitHub token required. Provide it in your profile." });
    }

    // Check if already connected
    const existing = await Repo.findOne({
      userId: req.user._id,
      fullName: `${owner}/${repoName}`,
    });
    if (existing) {
      return res.status(409).json({ error: "Repo already connected", repo: existing });
    }

    const repoInfo = await fetchRepoInfo(token, owner, repoName);

    // Fetch file tree
    const tree = await fetchRepoTree(token, owner, repoName, repoInfo.default_branch);
    const fileTree = buildFileTree(tree);

    const repo = new Repo({
      userId: req.user._id,
      name: repoName,
      fullName: `${owner}/${repoName}`,
      githubUrl,
      owner,
      defaultBranch: repoInfo.default_branch,
      fileTree,
      collaborators: [req.user._id],
    });

    await repo.save();

    res.status(201).json({ repo });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: "Repository not found" });
    }
    next(error);
  }
});

// Index a repo (generate embeddings)
router.post("/:id/index", authenticate, async (req, res, next) => {
  try {
    const repo = await Repo.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found" });
    }

    const token = req.user.githubToken;
    if (!token) {
      return res.status(400).json({ error: "GitHub token required" });
    }

    const files = await fetchAllFiles(
      token,
      repo.owner,
      repo.name,
      repo.defaultBranch
    );

    const chunkCount = await indexRepository(repo._id, files);

    repo.isIndexed = true;
    repo.indexedAt = new Date();
    await repo.save();

    res.json({
      message: "Repository indexed successfully",
      chunksCreated: chunkCount,
      filesProcessed: files.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get all repos for user
router.get("/", authenticate, async (req, res, next) => {
  try {
    const repos = await Repo.find({
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    }).sort({ updatedAt: -1 });

    res.json({ repos });
  } catch (error) {
    next(error);
  }
});

// Get single repo
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const repo = await Repo.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found" });
    }

    res.json({ repo });
  } catch (error) {
    next(error);
  }
});

// Get file content
router.get("/:id/file", authenticate, async (req, res, next) => {
  try {
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ error: "File path is required" });
    }

    const repo = await Repo.findOne({
      _id: req.params.id,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found" });
    }

    const token = req.user.githubToken;
    if (!token) {
      return res.status(400).json({ error: "GitHub token required" });
    }

    const content = await fetchFileContent(
      token,
      repo.owner,
      repo.name,
      path,
      repo.defaultBranch
    );

    res.json({ content, path });
  } catch (error) {
    next(error);
  }
});

// Add collaborator
router.post("/:id/collaborators", authenticate, async (req, res, next) => {
  try {
    const { userId } = req.body;
    const repo = await Repo.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found or not owner" });
    }

    if (repo.collaborators.includes(userId)) {
      return res.status(409).json({ error: "User already a collaborator" });
    }

    repo.collaborators.push(userId);
    await repo.save();

    res.json({ repo });
  } catch (error) {
    next(error);
  }
});

// Delete repo
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const repo = await Repo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found or not owner" });
    }

    res.json({ message: "Repo deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
