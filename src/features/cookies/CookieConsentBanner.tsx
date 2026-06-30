'use client';

import { useState, useSyncExternalStore } from 'react';
import { ChevronDown, Cookie } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { LegalModal } from '@/features/legal/LegalModal';
import type { LegalDocId } from '@/features/legal/content';
import {
  acknowledgeCookies,
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  subscribeCookieConsent,
} from './cookieConsent';
import { NECESSARY_COOKIES } from './cookieRegistry';

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
  const [showDetails, setShowDetails] = useState(false);

  if (acknowledged) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Aviso de cookies"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-lg"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
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

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            className="flex items-center gap-1 self-start text-xs font-medium text-primary-600 hover:underline sm:pl-10"
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            />
            {showDetails ? 'Ocultar cookies que usamos' : 'Ver cookies que usamos'}
          </button>

          {showDetails && (
            <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-bg sm:ml-10">
              {NECESSARY_COOKIES.map((cookie) => (
                <li
                  key={cookie.name}
                  className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-3"
                >
                  <code className="shrink-0 font-mono text-xs font-semibold text-ink sm:w-32">
                    {cookie.name}
                  </code>
                  <span className="flex-1 text-xs text-ink-muted">{cookie.purpose}</span>
                  <span className="shrink-0 text-xs text-ink-subtle">{cookie.duration}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </>
  );
}
