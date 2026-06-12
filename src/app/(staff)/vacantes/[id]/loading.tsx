import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Strip skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-md bg-surface-2 animate-pulse" />
          <div className="h-7 w-56 rounded-md bg-surface-2 animate-pulse" />
        </div>
        <div className="flex items-center gap-6 rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-3 w-16 rounded bg-surface-2 animate-pulse" />
              <div className="h-6 w-10 rounded bg-surface-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-md bg-surface-2 animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" />
        Cargando vacante…
      </div>
    </div>
  );
}
