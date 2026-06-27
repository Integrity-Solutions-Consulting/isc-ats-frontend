'use client';

import { useState, useSyncExternalStore } from 'react';
import { Cookie } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { LegalModal } from '@/features/legal/LegalModal';
import type { LegalDocId } from '@/features/legal/content';
import {
  acknowledgeCookies,
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  subscribeCookieConsent,
} from './cookieConsent';

/**
 * Informational cookie notice. The app uses only strictly-necessary cookies, so
 * this informs rather than asks for granular consent. Shown until acknowledged
 * (stored per browser — see cookieConsent.ts).
 */
export function CookieConsentBanner() {
  const acknowledged = useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot,
  );
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);

  if (acknowledged) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Aviso de cookies"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-lg"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
          <Cookie className="hidden size-6 shrink-0 text-primary-600 sm:block" />

          <p className="flex-1 text-[13px] leading-relaxed text-ink-muted">
            Usamos cookies estrictamente necesarias para que el sitio funcione y
            para mantener tu sesión iniciada. No usamos cookies de seguimiento ni
            publicidad.{' '}
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="font-medium text-primary-600 hover:underline"
            >
              Ver política de privacidad
            </button>
          </p>

          <Button
            type="button"
            onClick={acknowledgeCookies}
            className="w-full shrink-0 sm:w-auto"
          >
            Entendido
          </Button>
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
