import { useEffect, useState, useCallback } from "react";
import { GitCommit, Clock, FileCode } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommits } from "@/hooks/useCommits";
import { useSocketEvent } from "@/hooks/useSocket";
import { CommitSkeleton } from "./Skeletons";

export default function CommitFeed({ repoId }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useCommits(repoId);
  const [liveCommits, setLiveCommits] = useState([]);
  const [summarizingSha, setSummarizingSha] = useState(null);

  const handleNewCommit = useCallback((commit) => {
    setLiveCommits((prev) => [commit, ...prev]);
  }, []);

  const summarizeCommit = async (sha) => {
    try {
      setSummarizingSha(sha);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/commits/${repoId}/summarize/${sha}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Update local state by adding the summary
        setLiveCommits(prev => prev.map(c => c.sha === sha ? { ...c, aiSummary: data.commit.aiSummary } : c));
        // Invalidate the cache to refetch commits in background
        queryClient.invalidateQueries(["commits", repoId]);
      }
    } catch (error) {
      console.error("Error summarizing commit:", error);
    } finally {
      setSummarizingSha(null);
    }
  };

  useSocketEvent("commit:new", handleNewCommit);

  const allCommits = [...liveCommits, ...(data?.commits || [])];

  if (isLoading) return <CommitSkeleton />;

  return (
    <div className="flex flex-col h-full bg-devpulse-bg">
      <div className="h-9 bg-devpulse-surface border-b border-devpulse-border flex items-center px-3">
        <GitCommit className="w-3.5 h-3.5 text-devpulse-accent mr-2" />
        <span className="text-xs font-heading font-bold text-devpulse-text">
          Live Commits
        </span>
        {liveCommits.length > 0 && (
          <span className="ml-2 px-1.5 py-0.5 bg-devpulse-accent/10 text-devpulse-accent text-[10px] font-mono rounded">
            {liveCommits.length} new
          </span>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {allCommits.length === 0 && (
            <p className="text-devpulse-muted text-xs text-center py-6">
              No commits yet. Push code to see live updates.
            </p>
          )}

          {allCommits.map((commit, i) => (
            <div
              key={commit.sha || i}
              className={`p-3 rounded-lg border transition-colors ${
                i < liveCommits.length
                  ? "border-devpulse-accent/30 bg-devpulse-accent/5"
                  : "border-devpulse-border bg-devpulse-card"
              }`}
            >
              <div className="flex items-start gap-2">
                {commit.author?.avatar ? (
                  <img
                    src={commit.author.avatar}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-devpulse-surface flex items-center justify-center">
                    <GitCommit className="w-3 h-3 text-devpulse-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-devpulse-text font-medium truncate">
                    {commit.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-devpulse-muted">
                      {commit.sha?.slice(0, 7)}
                    </span>
                    <span className="text-[10px] text-devpulse-muted flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {commit.timestamp
                        ? new Date(commit.timestamp).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  {commit.aiSummary ? (
                    <div className="mt-2 p-2 bg-devpulse-surface rounded text-xs text-devpulse-muted leading-relaxed border border-devpulse-border">
                      <span className="text-devpulse-accent font-mono text-[10px] block mb-1">
                        AI Summary
                      </span>
                      {commit.aiSummary}
                    </div>
                  ) : (
                    <button
                      onClick={() => summarizeCommit(commit.sha)}
                      disabled={summarizingSha === commit.sha}
                      className="mt-2 text-[10px] bg-devpulse-surface border border-devpulse-border rounded px-2 py-1 text-devpulse-accent hover:bg-devpulse-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {summarizingSha === commit.sha ? "Summarizing..." : "Summarize with AI"}
                    </button>
                  )}
                  {commit.filesChanged && commit.filesChanged.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-devpulse-muted">
                      <FileCode className="w-2.5 h-2.5" />
                      {commit.filesChanged.length} file
                      {commit.filesChanged.length > 1 ? "s" : ""} changed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
