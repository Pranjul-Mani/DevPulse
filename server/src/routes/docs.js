import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Repo from "../models/Repo.js";
import { generateDocs } from "../services/groqService.js";

const router = Router();

router.post("/generate", authenticate, async (req, res, next) => {
  try {
    const { repoId, fileName, codeContent } = req.body;

    if (!repoId || !fileName || !codeContent) {
      return res.status(400).json({ error: "repoId, fileName, and codeContent are required" });
    }

    const repo = await Repo.findOne({
      _id: repoId,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await generateDocs(fileName, codeContent);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;
