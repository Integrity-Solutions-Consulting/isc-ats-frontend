"use client";

import { EmptyState } from "@/design-system/molecules/EmptyState";
import { Button } from "@/design-system/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      title="No se pudo cargar el banco de talento"
      description="Ocurrió un error al obtener los datos. Intenta nuevamente."
      action={<Button onClick={reset}>Reintentar</Button>}
    />
  );
}
