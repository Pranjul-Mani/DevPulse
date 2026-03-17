import { useEffect, useState, useCallback } from "react";
import { GitCommit, Clock, FileCode } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommits } from "@/hooks/useCommits";
import { useSocketEvent } from "@/hooks/useSocket";
import { CommitSkeleton } from "./Skeletons";
import { useAuthStore } from "@/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function CommitFeed({ repoId }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useCommits(repoId);
  const [liveCommits, setLiveCommits] = useState([]);
  const [summarizingSha, setSummarizingSha] = useState(null);
  const [open, setOpen] = useState(false);

  const handleNewCommit = useCallback((commit) => {
    setLiveCommits((prev) => [commit, ...prev]);
  }, []);

  const summarizeCommit = async (sha) => {
    try {
      setSummarizingSha(sha);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/commits/${repoId}/summarize/${sha}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20 transition-all font-medium flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.15)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          <GitCommit className="w-3 h-3 relative z-10" />
          <span className="relative z-10">Live Commits</span>
          {liveCommits.length > 0 && (
            <span className="relative z-10 ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-mono rounded">
              {liveCommits.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-devpulse-bg2 border-devpulse-border max-w-2xl max-h-[80vh] overflow-hidden flex flex-col w-full">
        <DialogHeader>
          <DialogTitle className="text-devpulse-text font-heading flex items-center">
            <GitCommit className="w-5 h-5 inline mr-2 text-devpulse-accent" />
            Live Commits
          </DialogTitle>
          <DialogDescription className="text-devpulse-muted">
            Real-time commit updates for this repository.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 bg-devpulse-bg rounded-md border border-devpulse-border mt-4">
          <div className="h-9 bg-devpulse-surface border-b border-devpulse-border flex items-center px-3 shrink-0">
            <GitCommit className="w-3.5 h-3.5 text-devpulse-accent mr-2" />
            <span className="text-xs font-heading font-bold text-devpulse-text">
              Recent Activity
            </span>
            {liveCommits.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-devpulse-accent/10 text-devpulse-accent text-[10px] font-mono rounded">
                {liveCommits.length} new
              </span>
            )}
          </div>
          <ScrollArea className="flex-1 h-[50vh]">
            <div className="p-3 space-y-3">
              {isLoading ? (
                <CommitSkeleton />
              ) : allCommits.length === 0 ? (
                <p className="text-devpulse-muted text-xs text-center py-6">
                  No commits yet. Push code to see live updates.
                </p>
              ) : (
                allCommits.map((commit, i) => (
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
          ))
        )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
