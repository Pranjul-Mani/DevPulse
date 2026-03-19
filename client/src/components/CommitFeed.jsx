import { useState, useCallback } from "react";
import { GitCommit, Clock, FileCode, GitPullRequest } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import api from "@/lib/api";

// Fetch commits that belong to currently open PRs
const useOpenPRCommits = (repoId) =>
  useQuery({
    queryKey: ["commits-open-prs", repoId],
    queryFn: async () => {
      const { data } = await api.get(`/commits/${repoId}/open-prs`);
      return data; // { commits, openPRs }
    },
    enabled: !!repoId,
    staleTime: 30_000,
  });

export default function CommitFeed({ repoId }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useOpenPRCommits(repoId);
  const [summarizingSha, setSummarizingSha] = useState(null);
  const [open, setOpen] = useState(false);

  // When a new PR is opened/updated — refetch the open-PR commits list
  const handlePROpened = useCallback(() => {
    queryClient.invalidateQueries(["commits-open-prs", repoId]);
  }, [queryClient, repoId]);

  // When a PR is closed/merged — refetch so those commits disappear
  const handlePRClosed = useCallback(() => {
    queryClient.invalidateQueries(["commits-open-prs", repoId]);
  }, [queryClient, repoId]);

  useSocketEvent("pr:opened", handlePROpened);
  useSocketEvent("pr:closed", handlePRClosed);

  const commits = data?.commits || [];
  const openPRs = data?.openPRs || [];

  const summarizeCommit = async (sha) => {
    try {
      setSummarizingSha(sha);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/commits/${repoId}/summarize/${sha}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          },
        }
      );
      if (response.ok) {
        queryClient.invalidateQueries(["commits-open-prs", repoId]);
      }
    } catch (error) {
      console.error("Error summarizing commit:", error);
    } finally {
      setSummarizingSha(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20 transition-all font-medium flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.15)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
          <GitPullRequest className="w-3 h-3 relative z-10" />
          <span className="relative z-10">Live Commits</span>
          {openPRs.length > 0 && (
            <span className="relative z-10 ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-mono rounded">
              {openPRs.length} open PR{openPRs.length > 1 ? "s" : ""}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-devpulse-bg2 border-devpulse-border w-[95vw] max-w-5xl h-[90vh] p-6 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-devpulse-text font-heading flex items-center">
            <GitPullRequest className="w-5 h-5 inline mr-2 text-devpulse-accent" />
            Live Commits
          </DialogTitle>
          <DialogDescription className="text-devpulse-muted">
            Showing commits from <span className="text-devpulse-accent font-mono">{openPRs.length}</span> open pull request{openPRs.length !== 1 ? "s" : ""}. Commits disappear automatically when a PR is closed or merged.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 bg-devpulse-bg rounded-md border border-devpulse-border mt-4 overflow-hidden">
          {/* Header bar */}
          <div className="h-9 bg-devpulse-surface border-b border-devpulse-border flex items-center px-3 shrink-0 gap-2">
            <GitPullRequest className="w-3.5 h-3.5 text-devpulse-accent" />
            <span className="text-xs font-heading font-bold text-devpulse-text">
              Open PR Activity
            </span>
            {openPRs.length > 0 && (
              <div className="flex gap-1 ml-1 flex-wrap">
                {openPRs.map((pr) => (
                  <span
                    key={pr.prNumber}
                    className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-mono rounded border border-green-500/20"
                  >
                    #{pr.prNumber}
                  </span>
                ))}
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4 pr-6">
              {isLoading ? (
                <CommitSkeleton />
              ) : commits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <GitPullRequest className="w-10 h-10 text-devpulse-muted/30" />
                  <p className="text-devpulse-muted text-xs text-center">
                    No open pull requests found.
                    <br />
                    Commits will appear here when a PR is opened.
                  </p>
                </div>
              ) : (
                commits.map((commit, i) => (
                  <div
                    key={commit.sha || i}
                    className="p-4 rounded-lg border border-devpulse-border bg-devpulse-card transition-colors"
                  >
                    {/* PR badge */}
                    {commit.pr && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 font-mono rounded border border-green-500/20">
                          PR #{commit.pr.prNumber} · open
                        </span>
                        <span className="text-[10px] text-devpulse-muted truncate">
                          {commit.pr.prTitle}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      {commit.author?.avatar ? (
                        <img
                          src={commit.author.avatar}
                          alt=""
                          className="w-6 h-6 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-devpulse-surface flex items-center justify-center shrink-0">
                          <GitCommit className="w-3 h-3 text-devpulse-muted" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-devpulse-text font-medium break-words">
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
                          <div className="mt-2 p-2 bg-devpulse-surface rounded text-xs text-devpulse-muted leading-relaxed border border-devpulse-border break-words">
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
