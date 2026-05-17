import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  GitBranch,
  Database,
  Trash2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRepos, useIndexRepo, useDeleteRepo } from "@/hooks/useRepo";
import { useRepoStore } from "@/store/repoStore";
import { useAuthStore } from "@/store/authStore";
import ConnectRepoDialog from "@/components/ConnectRepoDialog";
import { Skeleton } from "@/components/Skeletons";

export default function DashboardPage() {
  const { data: repos, isLoading } = useRepos();
  const indexRepo = useIndexRepo();
  const deleteRepo = useDeleteRepo();
  const setCurrentRepo = useRepoStore((s) => s.setCurrentRepo);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openRepo = (repo) => {
    setCurrentRepo(repo);
    navigate(`/workspace/${repo._id}`);
  };

  return (
    <div className="min-h-screen bg-devpulse-bg">
      {/* Header */}
      <header className="border-b border-devpulse-border bg-devpulse-bg2 relative z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-2.5 h-2.5 bg-devpulse-accent rounded-full animate-pulse-scale" />
            <span className="font-heading font-extrabold text-xl text-devpulse-text group-hover:text-devpulse-accent transition-colors">
              DevPulse
            </span>
          </Link>
          <div className="flex items-center gap-4 relative" ref={profileRef}>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 rounded-full bg-devpulse-surface border border-devpulse-border flex items-center justify-center text-devpulse-accent font-heading font-bold hover:border-devpulse-accent transition-colors"
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </button>
            
            {profileOpen && (
              <div className="absolute top-12 right-0 w-48 bg-devpulse-surface border border-devpulse-border rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-devpulse-border mb-2">
                  <p className="text-sm font-bold text-devpulse-text truncate">{user?.name}</p>
                  <p className="text-xs text-devpulse-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-devpulse-bg transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-extrabold text-3xl text-devpulse-text">
              Your Repositories
            </h1>
            <p className="text-devpulse-muted text-sm mt-1">
              Connect a GitHub repo to start asking questions
            </p>
          </div>
          <ConnectRepoDialog />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-devpulse-border bg-devpulse-card"
              >
                <Skeleton className="h-5 w-48 mb-3" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : repos?.length === 0 ? (
          <div className="text-center py-20">
            <GitBranch className="w-12 h-12 text-devpulse-muted mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl text-devpulse-text mb-2">
              No repositories connected
            </h2>
            <p className="text-devpulse-muted text-sm mb-6">
              Connect your first GitHub repo to get started
            </p>
            <ConnectRepoDialog>
              <Button className="bg-devpulse-accent text-black hover:bg-devpulse-accent/80">
                Connect Repository
              </Button>
            </ConnectRepoDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos?.map((repo) => (
              <div
                key={repo._id}
                className="p-5 rounded-xl border border-devpulse-border bg-devpulse-card hover:border-devpulse-accent/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading font-bold text-devpulse-text">
                      {repo.name}
                    </h3>
                    <p className="text-xs text-devpulse-muted font-mono mt-0.5">
                      {repo.fullName}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteRepo.mutate(repo._id)}
                    className="text-devpulse-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {repo.isIndexed ? (
                    <span className="px-2 py-0.5 bg-devpulse-accent/10 text-devpulse-accent text-[10px] font-mono rounded">
                      ✓ Indexed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-mono rounded">
                      Not indexed
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!repo.isIndexed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-devpulse-border text-devpulse-muted hover:text-devpulse-accent hover:border-devpulse-accent text-xs"
                      onClick={() => indexRepo.mutate(repo._id)}
                      disabled={indexRepo.isPending}
                    >
                      {indexRepo.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      ) : (
                        <Database className="w-3 h-3 mr-1.5" />
                      )}
                      Index
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1 bg-devpulse-accent text-black hover:bg-devpulse-accent/80 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => openRepo(repo)}
                    disabled={!repo.isIndexed}
                  >
                    Open
                    <ArrowRight className="w-3 h-3 ml-1.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
