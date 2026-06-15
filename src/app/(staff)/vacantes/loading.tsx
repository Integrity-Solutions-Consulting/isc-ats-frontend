import { Spinner } from "@/design-system/atoms/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
      <Spinner size="sm" label="" aria-hidden />
      Cargando…
    </div>
  );
}
