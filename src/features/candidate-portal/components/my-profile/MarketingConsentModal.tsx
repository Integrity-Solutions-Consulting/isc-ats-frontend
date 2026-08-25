'use client';

import { useState } from 'react';
import { Button } from '@/design-system/ui/button';

interface MarketingConsentModalProps {
  open: boolean;
  onDecided: (subscribed: boolean) => void;
}

/**
 * Blocking first-decision modal shown to a candidate who has never decided on
 * marketing consent (profile.marketingConsentDecided === false).
 *
 * Deliberately has NO close affordance: no X button, no backdrop-click
 * dismiss, no Escape-key handler. The only way out is picking one of the two
 * buttons below — a decision must be made, but neither option is favored
 * (both share the exact same variant/size/className, see D2).
 */
export function MarketingConsentModal({ open, onDecided }: MarketingConsentModalProps) {
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const decide = async (subscribed: boolean) => {
    setSaving(true);
    try {
      await fetch('/api/candidate/consents/marketing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed, source: 'profile_modal' }),
      });
    } catch {
      // Best-effort: the modal still closes and reflects the choice locally;
      // if the write failed, the next profile load will re-show the modal
      // since marketingConsentDecided would still be false server-side.
    } finally {
      setSaving(false);
      onDecided(subscribed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <h2 className="text-lg font-bold text-ink mb-2">¿Quieres recibir novedades?</h2>
        <p className="text-sm text-ink-muted mb-6">
          Podemos avisarte por correo sobre nuevas vacantes y novedades de Integrity Solutions.
          Puedes cambiar esta preferencia cuando quieras desde tu perfil.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={saving}
            onClick={() => decide(false)}
          >
            No, gracias
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={saving}
            onClick={() => decide(true)}
          >
            Sí, quiero recibirlas
          </Button>
        </div>
      </div>
    </div>
  );
}
