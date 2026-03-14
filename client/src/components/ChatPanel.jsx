import { useState, useRef, useEffect } from "react";
import { Send, Bug, MessageSquare, Trash2, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { useRepoStore } from "@/store/repoStore";
import { ChatSkeleton } from "./Skeletons";

export default function ChatPanel({ repoId }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat(repoId);
  const { isStreaming, streamContent, chatMode, setChatMode, clearChat } =
    useChatStore();
  const { currentRepo } = useRepoStore();
  const isIndexed = currentRepo?.isIndexed;
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-devpulse-bg">
      {/* Header */}
      <div className="h-10 bg-devpulse-surface border-b border-devpulse-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-devpulse-accent" />
          <span className="text-xs font-heading font-bold text-devpulse-text">
            AI Chat
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setChatMode("qa")}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              chatMode === "qa"
                ? "bg-devpulse-accent/10 text-devpulse-accent"
                : "text-devpulse-muted hover:text-devpulse-text"
            }`}
          >
            <MessageSquare className="w-3 h-3 inline mr-1" />
            Q&A
          </button>
          <button
            onClick={() => setChatMode("bug")}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              chatMode === "bug"
                ? "bg-devpulse-accent3/10 text-devpulse-accent3"
                : "text-devpulse-muted hover:text-devpulse-text"
            }`}
          >
            <Bug className="w-3 h-3 inline mr-1" />
            Bug
          </button>
          <button
            onClick={clearChat}
            className="px-2 py-1 rounded text-xs text-devpulse-muted hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">🧠</div>
              <p className="text-devpulse-muted text-sm">
                {chatMode === "bug"
                  ? "Paste an error or stack trace to analyze"
                  : "Ask anything about your codebase"}
              </p>
              <p className="text-devpulse-muted/50 text-xs mt-1">
                AI will search your indexed code for answers
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="flex gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-devpulse-accent2/20"
                    : "bg-devpulse-accent/20"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-devpulse-accent2" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-devpulse-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-devpulse-muted mb-1 font-mono">
                  {msg.role === "user" ? "you" : "DevPulse AI"}
                </div>
                <div className="markdown-body text-sm text-devpulse-text">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isStreaming && streamContent && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-devpulse-accent/20">
                <Bot className="w-3.5 h-3.5 text-devpulse-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-devpulse-muted mb-1 font-mono">
                  DevPulse AI
                </div>
                <div className="markdown-body text-sm text-devpulse-text streaming-cursor">
                  <ReactMarkdown>{streamContent}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-devpulse-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !isIndexed
                ? "Index repo to use AI chat..."
                : chatMode === "bug"
                ? "Paste error or stack trace..."
                : "Ask about your codebase..."
            }
            className="flex-1 bg-devpulse-surface border border-devpulse-border rounded-lg px-3 py-2 text-sm text-devpulse-text placeholder:text-devpulse-muted/50 focus:outline-none focus:border-devpulse-accent/50 font-mono"
            disabled={isStreaming || !isIndexed}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming || !isIndexed}
            className="bg-devpulse-accent hover:bg-devpulse-accent/80 text-black h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
