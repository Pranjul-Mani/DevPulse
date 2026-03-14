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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/docs/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          className="h-7 text-xs bg-devpulse-bg hover:bg-devpulse-surface text-devpulse-muted hover:text-devpulse-text border-devpulse-border ml-auto mr-2"
        >
          <BookOpen className="w-3 h-3 mr-1.5" />
          Auto Docs
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
