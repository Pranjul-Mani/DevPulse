export function Skeleton({ className }) {
  return <div className={`skeleton ${className || ""}`} />;
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FileTreeSkeleton() {
  return (
    <div className="space-y-2 p-4 w-full">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 12}px` }}>
          <Skeleton className="w-4 h-4 shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="p-4 space-y-3 w-full">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="flex gap-4 items-center w-full">
          <Skeleton className="w-8 h-4 shrink-0" />
          <Skeleton className="h-4 rounded-md shrink-0" style={{ width: `${30 + Math.random() * 60}%` }} />
        </div>
      ))}
    </div>
  );
}

export function CommitSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 items-start">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-12 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
