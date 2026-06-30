import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Shown when a staff user opens a section their role does not grant. The backend
 * already blocks the data; this turns a broken/empty page into a clear message.
 */
export function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-danger/10">
        <ShieldAlert className="size-8 text-danger" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-ink">No tenés acceso a esta sección</h1>
        <p className="max-w-md text-sm text-ink-muted">
          Tu rol no incluye permiso para ver esta página. Si creés que deberías
          tener acceso, contactá a un administrador.
        </p>
      </div>
      <Button asChild className="mt-2">
        <Link href={ROUTES.dashboard}>Volver al inicio</Link>
      </Button>
    </div>
  );
}
