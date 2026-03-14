# DevPulse - AI-Powered Developer Collaboration Workspace

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Upstash Redis account (free tier)
- Groq API key (free)
- HuggingFace API key (free)

### Setup

1. **Clone & install**
```bash
git clone https://github.com/yourteam/devpulse.git
cd devpulse
npm run install:all
```

2. **Configure environment**
```bash
cp server/.env.example server/.env
# Fill in your API keys in server/.env
```

3. **Run development**
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui + Zustand + TanStack Query
- **Backend**: Node.js + Express + MongoDB + Socket.io + BullMQ
- **AI**: Groq (Llama 3.1 70B) + HuggingFace Embeddings + MongoDB Atlas Vector Search
- **Infra**: Upstash Redis + Vercel


## Features
- 🧠 RAG-powered codebase Q&A
- ⚡ AI commit summarization
- 🐛 Intelligent bug assistant
- 📋 PR summarizer
- 👥 Real-time team collaboration
- 📚 Auto documentation generation
