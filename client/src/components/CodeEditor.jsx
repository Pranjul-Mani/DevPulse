import Editor from "@monaco-editor/react";
import { useRepoStore } from "@/store/repoStore";
import { EditorSkeleton } from "./Skeletons";
import AutoDocsDialog from "./AutoDocsDialog";

export default function CodeEditor() {
  const { selectedFile, fileContent, fileLoading } = useRepoStore();

  const getLanguage = (path) => {
    if (!path) return "plaintext";
    const ext = path.split(".").pop()?.toLowerCase();
    const langMap = {
      js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
      py: "python", java: "java", go: "go", rs: "rust", rb: "ruby",
      php: "php", c: "c", cpp: "cpp", cs: "csharp", swift: "swift",
      html: "html", css: "css", scss: "scss", json: "json",
      yaml: "yaml", yml: "yaml", md: "markdown", sql: "sql",
      sh: "shell", bash: "shell", xml: "xml", graphql: "graphql",
    };
    return langMap[ext] || "plaintext";
  };

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-devpulse-bg">
        <div className="text-center">
          <div className="text-4xl mb-4">📂</div>
          <p className="text-devpulse-muted text-sm">
            Select a file from the sidebar to view
          </p>
        </div>
      </div>
    );
  }

  if (fileLoading) {
    return <EditorSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col bg-devpulse-bg min-h-0 relative">
      <div className="h-9 bg-devpulse-surface border-b border-devpulse-border flex items-center px-4">
        <span className="text-xs font-mono text-devpulse-muted flex-1">
          {selectedFile}
        </span>
        <AutoDocsDialog />
      </div>
      <div className="flex-1 relative min-h-0">
        <Editor
          height="100%"
          language={getLanguage(selectedFile)}
          value={fileContent || "// Loading..."}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: true },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "off",
            renderWhitespace: "selection",
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
