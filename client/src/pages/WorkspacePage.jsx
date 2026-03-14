import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
  Database,
  Loader2,
  Users,
  GitCommit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRepo, useIndexRepo } from "@/hooks/useRepo";
import { useRepoStore } from "@/store/repoStore";
import { useSocket } from "@/hooks/useSocket";
import FileTree from "@/components/FileTree";
import CodeEditor from "@/components/CodeEditor";
import ChatPanel from "@/components/ChatPanel";
import CommitFeed from "@/components/CommitFeed";
import PRSummarizer from "@/components/PRSummarizer";
import { FileTreeSkeleton } from "@/components/Skeletons";

export default function WorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: repo, isLoading } = useRepo(id);
  const { setCurrentRepo, onlineUsers } = useRepoStore();
  const indexRepo = useIndexRepo();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);

  useSocket(id);

  useEffect(() => {
    if (repo) setCurrentRepo(repo);
  }, [repo, setCurrentRepo]);

  if (isLoading) {
    return (
      <div className="h-screen bg-devpulse-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-devpulse-accent animate-spin" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="h-screen bg-devpulse-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-devpulse-muted mb-4">Repository not found</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-devpulse-bg overflow-hidden">
      {/* Top bar */}
      <div className="h-10 bg-devpulse-bg2 border-b border-devpulse-border flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-devpulse-muted hover:text-devpulse-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-2 h-2 bg-devpulse-accent rounded-full animate-pulse" />
          <span className="font-heading font-bold text-sm text-devpulse-text">
            {repo.fullName}
          </span>
          {repo.isIndexed ? (
            <span className="px-1.5 py-0.5 bg-devpulse-accent/10 text-devpulse-accent text-[9px] font-mono rounded">
              INDEXED
            </span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-yellow-400 text-xs h-6"
              onClick={() => indexRepo.mutate(repo._id)}
              disabled={indexRepo.isPending}
            >
              {indexRepo.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Database className="w-3 h-3 mr-1" />
              )}
              Index Repo
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <PRSummarizer repoId={repo._id} />

          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-devpulse-muted">
              <Users className="w-3 h-3" />
              {onlineUsers.length}
            </div>
          )}

          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className="p-1 text-devpulse-muted hover:text-devpulse-text transition-colors"
          >
            {leftOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setBottomOpen(!bottomOpen)}
            className="p-1 text-devpulse-muted hover:text-devpulse-text transition-colors"
          >
            <GitCommit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className="p-1 text-devpulse-muted hover:text-devpulse-text transition-colors"
          >
            {rightOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar - File tree */}
        {leftOpen && (
          <div className="w-64 border-r border-devpulse-border flex-shrink-0 flex flex-col">
            <div className="h-8 bg-devpulse-surface border-b border-devpulse-border flex items-center px-3">
              <span className="text-[10px] font-mono text-devpulse-muted uppercase tracking-wider">
                Explorer
              </span>
            </div>
            {isLoading ? (
              <FileTreeSkeleton />
            ) : (
              <FileTree tree={repo.fileTree} repoId={repo._id} />
            )}
          </div>
        )}

        {/* Center area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor />
          </div>

          {/* Bottom panel - Commit feed */}
          {bottomOpen && (
            <div className="h-60 border-t border-devpulse-border flex-shrink-0">
              <CommitFeed repoId={repo._id} />
            </div>
          )}
        </div>

        {/* Right panel - Chat */}
        {rightOpen && (
          <div className="w-80 border-l border-devpulse-border flex-shrink-0">
            <ChatPanel repoId={repo._id} />
          </div>
        )}
      </div>
    </div>
  );
}
