import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import repoRoutes from "./routes/repo.js";
import chatRoutes from "./routes/chat.js";
import commitRoutes from "./routes/commits.js";
import prRoutes from "./routes/pr.js";
import annotationRoutes from "./routes/annotations.js";
import webhookRoutes from "./routes/webhooks.js";
import docsRoutes from "./routes/docs.js";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Socket.io
const io = initSocket(server);
app.set("io", io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/commits", commitRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/annotations", annotationRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/docs", docsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start BullMQ worker (optional, only if Redis configured)
if (process.env.UPSTASH_REDIS_URL) {
  import("./workers/indexWorker.js")
    .then(({ startIndexWorker }) => {
      startIndexWorker();
      console.log("Index worker started");
    })
    .catch((err) => {
      console.warn("Could not start index worker:", err.message);
    });
}

export default app;
