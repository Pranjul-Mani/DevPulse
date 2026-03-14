import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Annotation from "../models/Annotation.js";

const router = Router();

// Get annotations for a file
router.get("/:repoId", authenticate, async (req, res, next) => {
  try {
    const { filePath } = req.query;
    const filter = { repoId: req.params.repoId };
    if (filePath) filter.filePath = filePath;

    const annotations = await Annotation.find(filter)
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({ annotations });
  } catch (error) {
    next(error);
  }
});

// Create annotation
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { repoId, filePath, lineNumber, content } = req.body;

    if (!repoId || !filePath || lineNumber == null || !content) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const annotation = await Annotation.create({
      repoId,
      userId: req.user._id,
      filePath,
      lineNumber,
      content,
    });

    const populated = await annotation.populate("userId", "name email avatar");

    // Emit via socket
    if (req.app.get("io")) {
      req.app.get("io").to(`repo:${repoId}`).emit("annotation:new", populated);
    }

    res.status(201).json({ annotation: populated });
  } catch (error) {
    next(error);
  }
});

// Delete annotation
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    await Annotation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    res.json({ message: "Annotation deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
