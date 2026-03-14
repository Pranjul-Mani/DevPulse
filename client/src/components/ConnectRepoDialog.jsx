import { useState } from "react";
import { GitBranch, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useConnectRepo } from "@/hooks/useRepo";

export default function ConnectRepoDialog({ children }) {
  const [open, setOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const connectRepo = useConnectRepo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await connectRepo.mutateAsync({ githubUrl, githubToken });
      setOpen(false);
      setGithubUrl("");
      setGithubToken("");
    } catch (error) {
      // Error toast is handled by useConnectRepo
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-devpulse-accent text-black hover:bg-devpulse-accent/80">
            <Plus className="w-4 h-4 mr-2" />
            Connect Repo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-devpulse-bg2 border-devpulse-border">
        <DialogHeader>
          <DialogTitle className="text-devpulse-text font-heading">
            <GitBranch className="w-5 h-5 inline mr-2 text-devpulse-accent" />
            Connect GitHub Repository
          </DialogTitle>
          <DialogDescription className="text-devpulse-muted">
            Paste your GitHub repository URL and a personal access token.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-xs font-mono text-devpulse-muted block mb-1.5">
              Repository URL
            </label>
            <Input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="bg-devpulse-surface border-devpulse-border text-devpulse-text"
              required
            />
          </div>
          <div>
            <label className="text-xs font-mono text-devpulse-muted block mb-1.5">
              GitHub Personal Access Token
            </label>
            <Input
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              className="bg-devpulse-surface border-devpulse-border text-devpulse-text"
              required
            />
            <p className="text-[10px] text-devpulse-muted mt-1">
              Needs repo scope. Create at GitHub → Settings → Developer settings → Personal access tokens
            </p>
          </div>
          <Button
            type="submit"
            className="w-full bg-devpulse-accent text-black hover:bg-devpulse-accent/80 font-bold"
            disabled={connectRepo.isPending}
          >
            {connectRepo.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4 mr-2" />
            )}
            Connect Repository
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
