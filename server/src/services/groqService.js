import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

export const summarizeCommit = async (diff, commitMessage) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer. Summarize the following git commit in plain English for non-technical team members. Be concise but thorough. Include:
- What changed
- Why it likely changed
- Any potential risks or breaking changes
Keep it under 200 words.`,
      },
      {
        role: "user",
        content: `Commit message: ${commitMessage}\n\nDiff:\n${diff.slice(0, 8000)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || "Unable to generate summary.";
};

export const answerCodeQuestion = async (question, codeContext, history = []) => {
  const messages = [
    {
      role: "system",
      content: `You are DevPulse AI, an expert code assistant. You answer questions about a codebase using the context provided. Always reference specific file paths and line numbers when possible. Be concise, accurate, and helpful. If you don't know something from the context, say so rather than guessing.`,
    },
    ...history.slice(-6),
    {
      role: "user",
      content: `Context from codebase:\n\n${codeContext}\n\nQuestion: ${question}`,
    },
  ];

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.4,
    max_tokens: 2048,
    stream: true,
  });

  return response;
};

export const analyzeBug = async (errorTrace, codeContext) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a senior debugging assistant. Given an error/stack trace and relevant code context, identify:
1. **Root Cause**: What exactly is causing the error
2. **File & Line**: The specific file and line number
3. **Fix**: A concrete code fix with a snippet
4. **Explanation**: Why this fix works

Be precise and reference the actual code provided.`,
      },
      {
        role: "user",
        content: `Error/Stack Trace:\n${errorTrace}\n\nRelevant Code:\n${codeContext}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    stream: true,
  });

  return response;
};

export const summarizePR = async (prData) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a PR review assistant. Summarize the pull request for a non-technical audience. Include:
1. **What Changed**: Plain English description
2. **Why**: The purpose and motivation
3. **Impact**: What parts of the app are affected
4. **Risk Level**: Low / Medium / High with explanation
5. **Key Files**: Most important files changed

Keep it clear and professional.`,
      },
      {
        role: "user",
        content: `PR Title: ${prData.title}\nPR Body: ${prData.body || "No description"}\nComments: ${prData.comments || "None"}\n\nFiles Changed:\n${prData.diff?.slice(0, 8000) || "No diff available"}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || "Unable to generate PR summary.";
};

export const generateDocs = async (fileName, codeContent) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are an expert technical writer and developer. Generate comprehensive, well-structured Markdown documentation for the provided code file. Include:
1. **Overview**: What this file does.
2. **Key Components**: Classes, functions, or major variables.
3. **Usage Examples**: How it might be used (if applicable).
4. **Dependencies/Requires**: Notable imports or external dependencies.

Use clear formatting with headers, lists, and code blocks. Be professional and concise.`,
      },
      {
        role: "user",
        content: `File: ${fileName}\n\nCode:\n${codeContent.slice(0, 15000)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 2500,
    stream: true,
  });

  return response;
};
