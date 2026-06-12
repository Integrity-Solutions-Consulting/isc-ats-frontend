"use client";

import { EmptyState } from "@/design-system/molecules/EmptyState";
import { Button } from "@/design-system/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      title="Algo salió mal"
      description="No se pudo cargar la vacante. Intenta nuevamente."
      action={<Button onClick={reset}>Reintentar</Button>}
    />
  );
}
