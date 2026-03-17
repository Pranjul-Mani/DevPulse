import { useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRepoStore } from "@/store/repoStore";
import { useAuthStore } from "@/store/authStore";

export default function AutoDocsDialog() {
  const { currentRepo, selectedFile, fileContent } = useRepoStore();
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) return;
    if (!currentRepo || !selectedFile || !fileContent) return;
    
    setIsLoading(true);
    setDocs("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/docs/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          repoId: currentRepo._id,
          fileName: selectedFile,
          codeContent: fileContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate docs");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              setDocs((prev) => prev + data.content);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setDocs("Error generating documentation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleGenerate}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 transition-all font-medium flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)] relative overflow-hidden group ml-auto mr-2"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          <BookOpen className="w-3 h-3 relative z-10" />
          <span className="relative z-10">Auto Docs</span>
          <span className="relative flex h-1.5 w-1.5 ml-1 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-devpulse-surface border-devpulse-border flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-devpulse-text font-heading text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-devpulse-accent" />
            Documentation for {selectedFile?.split("/").pop()}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">
          <ScrollArea className="h-[60vh] rounded-md border border-devpulse-border bg-devpulse-bg p-4">
            {isLoading && !docs ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 pt-20">
                <Loader2 className="w-8 h-8 text-devpulse-accent animate-spin" />
                <p className="text-sm text-devpulse-muted animate-pulse">
                  AI is reading your code and writing documentation...
                </p>
              </div>
            ) : (
              <div className="markdown-body text-sm text-devpulse-text">
                <ReactMarkdown>{docs}</ReactMarkdown>
                {isLoading && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-devpulse-accent animate-pulse" />
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
