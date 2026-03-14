import Embedding from "../models/Embedding.js";
import { generateEmbedding } from "./embeddingService.js";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

const detectLanguage = (filePath) => {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const langMap = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", java: "java", go: "go", rs: "rust", rb: "ruby",
    php: "php", c: "c", cpp: "cpp", cs: "csharp", swift: "swift",
    kt: "kotlin", scala: "scala", vue: "vue", svelte: "svelte",
    html: "html", css: "css", scss: "scss", json: "json",
    yaml: "yaml", yml: "yaml", md: "markdown", sql: "sql",
    sh: "shell", bash: "shell", graphql: "graphql", prisma: "prisma",
  };
  return langMap[ext] || "unknown";
};

export const chunkCode = (content, filePath) => {
  const lines = content.split("\n");
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentChunk.push(line);
    currentSize += line.length + 1;

    if (currentSize >= CHUNK_SIZE) {
      chunks.push({
        content: currentChunk.join("\n"),
        startLine,
        endLine: i + 1,
      });

      const overlapLines = Math.min(currentChunk.length, 5);
      currentChunk = currentChunk.slice(-overlapLines);
      currentSize = currentChunk.join("\n").length;
      startLine = i + 2 - overlapLines;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join("\n"),
      startLine,
      endLine: lines.length,
    });
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
    filePath,
    language: detectLanguage(filePath),
  }));
};

export const indexRepository = async (repoId, files) => {
  await Embedding.deleteMany({ repoId });

  const allChunks = [];
  for (const file of files) {
    const chunks = chunkCode(file.content, file.path);
    allChunks.push(...chunks);
  }

  const batchSize = 5;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);

    const embeddings = await Promise.all(
      batch.map((chunk) =>
        generateEmbedding(`${chunk.filePath}\n${chunk.content}`)
      )
    );

    const docs = batch.map((chunk, idx) => ({
      repoId,
      filePath: chunk.filePath,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[idx],
      metadata: {
        language: chunk.language,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
      },
    }));

    await Embedding.insertMany(docs);

    if (i + batchSize < allChunks.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allChunks.length;
};

export const vectorSearch = async (repoId, queryText, limit = 5) => {
  const queryEmbedding = await generateEmbedding(queryText);

  const results = await Embedding.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit,
        filter: { repoId: repoId },
      },
    },
    {
      $project: {
        filePath: 1,
        content: 1,
        metadata: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results;
};

export const buildContext = (chunks) => {
  return chunks
    .map(
      (chunk) =>
        `--- File: ${chunk.filePath} (Lines ${chunk.metadata?.startLine}-${chunk.metadata?.endLine}) ---\n${chunk.content}`
    )
    .join("\n\n");
};
