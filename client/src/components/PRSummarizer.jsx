import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
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
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function PRSummarizerDialog({ repoId }) {
  const [open, setOpen] = useState(false);
  const [prNumber, setPrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prNumber) return;

    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post("/pr/summarize", {
        repoId,
        prNumber: parseInt(prNumber),
      });
      setResult(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to summarize PR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20 transition-all font-medium flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.15)] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          <FileText className="w-3 h-3 relative z-10" />
          <span className="relative z-10">PR Summary</span>
          <span className="relative flex h-1.5 w-1.5 ml-1 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-devpulse-bg2 border-devpulse-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-devpulse-text font-heading">
            <FileText className="w-5 h-5 inline mr-2 text-devpulse-accent2" />
            PR Summarizer
          </DialogTitle>
          <DialogDescription className="text-devpulse-muted">
            Enter a PR number to get an AI-generated summary.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <Input
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            placeholder="PR number (e.g. 42)"
            type="number"
            className="bg-devpulse-surface border-devpulse-border text-devpulse-text"
          />
          <Button
            type="submit"
            className="bg-devpulse-accent2 text-black hover:bg-devpulse-accent2/80"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Summarize"
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-devpulse-surface rounded-lg border border-devpulse-border">
              <div>
                <p className="text-sm font-medium text-devpulse-text">
                  {result.pr.title}
                </p>
                <p className="text-xs text-devpulse-muted mt-1">
                  by @{result.pr.user} · {result.pr.filesChanged} files ·{" "}
                  <span className="text-green-400">
                    +{result.pr.additions}
                  </span>{" "}
                  <span className="text-red-400">
                    -{result.pr.deletions}
                  </span>
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  result.pr.state === "open"
                    ? "bg-green-400/10 text-green-400"
                    : "bg-purple-400/10 text-purple-400"
                }`}
              >
                {result.pr.state}
              </span>
            </div>

            <div className="p-4 bg-devpulse-card rounded-lg border border-devpulse-border">
              <div className="markdown-body text-sm">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
