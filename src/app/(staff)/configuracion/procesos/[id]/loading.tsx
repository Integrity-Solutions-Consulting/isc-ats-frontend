import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
      <Loader2 className="size-4 animate-spin" />
      Cargando proceso…
    </div>
  );
}
