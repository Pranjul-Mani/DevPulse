import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Conversation from "../models/Conversation.js";
import Repo from "../models/Repo.js";
import { vectorSearch, buildContext } from "../services/ragService.js";
import { answerCodeQuestion, analyzeBug } from "../services/groqService.js";

const router = Router();

// Ask a question (RAG Q&A)
router.post("/ask", authenticate, async (req, res, next) => {
  try {
    const { repoId, question, conversationId } = req.body;

    if (!repoId || !question) {
      return res.status(400).json({ error: "repoId and question are required" });
    }

    const repo = await Repo.findOne({
      _id: repoId,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo) {
      return res.status(404).json({ error: "Repo not found" });
    }

    if (!repo.isIndexed) {
      return res.status(400).json({ error: "Repo not indexed yet. Index it first." });
    }

    // Vector search for relevant chunks
    const chunks = await vectorSearch(repo._id, question, 5);
    console.log(`[RAG Q&A] Question: "${question}" -> Found ${chunks.length} chunks`);
    const context = buildContext(chunks);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
      conversation = new Conversation({
        repoId,
        userId: req.user._id,
        title: question.slice(0, 80),
        type: "qa",
        messages: [],
      });
    }

    // Build history for context (exclude the current question we are about to add)
    const history = conversation.messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message
    conversation.messages.push({
      role: "user",
      content: question,
    });

    // Stream response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await answerCodeQuestion(question, context, history);

    let fullResponse = "";

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      const content = delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save assistant message
    conversation.messages.push({
      role: "assistant",
      content: fullResponse,
    });

    await conversation.save();

    res.write(
      `data: ${JSON.stringify({
        done: true,
        conversationId: conversation._id,
        sources: chunks.map((c) => ({
          filePath: c.filePath,
          startLine: c.metadata?.startLine,
          endLine: c.metadata?.endLine,
          score: c.score,
        })),
      })}\n\n`
    );
    res.end();
  } catch (error) {
    next(error);
  }
});

// Bug assistant
router.post("/bug", authenticate, async (req, res, next) => {
  try {
    const { repoId, errorTrace, conversationId } = req.body;

    if (!repoId || !errorTrace) {
      return res.status(400).json({ error: "repoId and errorTrace are required" });
    }

    const repo = await Repo.findOne({
      _id: repoId,
      $or: [{ userId: req.user._id }, { collaborators: req.user._id }],
    });

    if (!repo || !repo.isIndexed) {
      return res.status(400).json({ error: "Repo not found or not indexed" });
    }

    const chunks = await vectorSearch(repo._id, errorTrace, 5);
    const context = buildContext(chunks);

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
      conversation = new Conversation({
        repoId,
        userId: req.user._id,
        title: `Bug: ${errorTrace.slice(0, 60)}`,
        type: "bug",
        messages: [],
      });
    }

    conversation.messages.push({
      role: "user",
      content: errorTrace,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await analyzeBug(errorTrace, context);

    let fullResponse = "";

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      const content = delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    conversation.messages.push({
      role: "assistant",
      content: fullResponse,
    });

    await conversation.save();

    res.write(
      `data: ${JSON.stringify({
        done: true,
        conversationId: conversation._id,
        sources: chunks.map((c) => ({
          filePath: c.filePath,
          startLine: c.metadata?.startLine,
          endLine: c.metadata?.endLine,
        })),
      })}\n\n`
    );
    res.end();
  } catch (error) {
    next(error);
  }
});

// Get conversations
router.get("/conversations", authenticate, async (req, res, next) => {
  try {
    const { repoId } = req.query;
    const filter = { userId: req.user._id };
    if (repoId) filter.repoId = repoId;

    const conversations = await Conversation.find(filter)
      .select("title type repoId updatedAt messages")
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json({
      conversations: conversations.map((c) => ({
        _id: c._id,
        title: c.title,
        type: c.type,
        repoId: c.repoId,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single conversation
router.get("/conversations/:id", authenticate, async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

// Delete conversation
router.delete("/conversations/:id", authenticate, async (req, res, next) => {
  try {
    await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    res.json({ message: "Conversation deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
