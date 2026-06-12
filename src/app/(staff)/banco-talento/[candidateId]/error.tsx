'use client';

import Link from 'next/link';
import { Button } from '@/design-system/ui/button';
import { ROUTES } from '@/shared/constants/routes';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-lg font-semibold text-ink">No se pudo cargar el perfil del candidato.</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>Reintentar</Button>
        <Button asChild>
          <Link href={ROUTES.bancoTalento}>Volver al banco de talento</Link>
        </Button>
      </div>
    </div>
  );
}
