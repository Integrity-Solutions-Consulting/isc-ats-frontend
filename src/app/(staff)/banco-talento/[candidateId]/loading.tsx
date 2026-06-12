export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-surface-2" />
        <div className="h-10 w-10 rounded-full bg-surface-2" />
        <div className="h-6 w-48 rounded bg-surface-2" />
      </div>
      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 rounded-lg border border-border bg-surface-2" />
      ))}
    </div>
  );
}
