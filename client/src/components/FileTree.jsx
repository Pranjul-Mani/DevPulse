import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRepoStore } from "@/store/repoStore";
import { useFileContent } from "@/hooks/useRepo";
import { cn } from "@/lib/utils";

const fileIcons = {
  js: "text-yellow-400",
  jsx: "text-cyan-400",
  ts: "text-blue-400",
  tsx: "text-blue-400",
  py: "text-green-400",
  json: "text-yellow-300",
  md: "text-gray-400",
  css: "text-pink-400",
  scss: "text-pink-400",
  html: "text-orange-400",
  yaml: "text-red-300",
  yml: "text-red-300",
};

function TreeNode({ node, depth = 0, repoId }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const { selectedFile, setSelectedFile } = useRepoStore();
  const isSelected = selectedFile === node.path;
  const ext = node.name.split(".").pop()?.toLowerCase();
  const iconColor = fileIcons[ext] || "text-devpulse-muted";

  useFileContent(repoId, isSelected && node.type === "file" ? node.path : null);

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-1.5 w-full py-1 px-2 text-sm hover:bg-devpulse-surface rounded transition-colors text-left",
            "text-devpulse-text"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-devpulse-muted flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-devpulse-muted flex-shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="w-4 h-4 text-devpulse-accent flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-devpulse-accent flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children
              .sort((a, b) => {
                if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((child) => (
                <TreeNode
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  repoId={repoId}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setSelectedFile(node.path)}
      className={cn(
        "flex items-center gap-1.5 w-full py-1 px-2 text-sm rounded transition-colors text-left",
        isSelected
          ? "bg-devpulse-accent/10 text-devpulse-accent"
          : "text-devpulse-muted hover:bg-devpulse-surface hover:text-devpulse-text"
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <div className="w-3.5" />
      <FileCode className={cn("w-4 h-4 flex-shrink-0", iconColor)} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function FileTree({ tree, repoId }) {
  if (!tree || tree.length === 0) {
    return (
      <div className="p-4 text-center text-devpulse-muted text-sm">
        No files found
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {tree
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
          .map((node) => (
            <TreeNode key={node.path} node={node} repoId={repoId} />
          ))}
      </div>
    </ScrollArea>
  );
}
