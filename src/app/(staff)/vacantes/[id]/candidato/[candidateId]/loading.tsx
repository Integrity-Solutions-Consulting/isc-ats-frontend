import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-surface-2 animate-pulse" />
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-40 rounded bg-surface-2 animate-pulse" />
          <div className="h-3.5 w-24 rounded bg-surface-2 animate-pulse" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="flex gap-6">
        <div className="flex flex-col gap-6 flex-1 min-w-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <div className="h-4 w-32 rounded bg-surface-2 animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-surface-2 animate-pulse" />
                <div className="h-3.5 w-3/4 rounded bg-surface-2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div className="w-[300px] shrink-0">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm h-48 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" />
        Cargando perfil del candidato…
      </div>
    </div>
  );
}
