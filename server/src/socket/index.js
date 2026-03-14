import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join repo room
    socket.on("repo:join", (repoId) => {
      socket.join(`repo:${repoId}`);
      socket.to(`repo:${repoId}`).emit("presence:join", {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Leave repo room
    socket.on("repo:leave", (repoId) => {
      socket.leave(`repo:${repoId}`);
      socket.to(`repo:${repoId}`).emit("presence:leave", {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // File selection (presence feature)
    socket.on("file:select", ({ repoId, filePath }) => {
      socket.to(`repo:${repoId}`).emit("file:selected", {
        userId: socket.userId,
        filePath,
        timestamp: new Date(),
      });
    });

    // Typing indicator
    socket.on("chat:typing", ({ repoId, isTyping }) => {
      socket.to(`repo:${repoId}`).emit("chat:typing", {
        userId: socket.userId,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
