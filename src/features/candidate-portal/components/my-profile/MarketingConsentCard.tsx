'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

interface MarketingConsentCardProps {
  subscribed: boolean;
}

/**
 * Lets a candidate who already decided once (marketingConsentDecided ===
 * true) flip their marketing-consent preference. Structurally modeled on
 * DangerZoneCard (same shell/heading classes), but with the neutral border
 * tokens instead of the danger-red ones.
 *
 * Optimistic update: flips local state immediately, then rolls back on a
 * failed request. No TanStack Query mutation precedent exists for this kind
 * of single-field toggle elsewhere in candidate-portal, so plain local state
 * is used rather than introducing a new pattern for this scope.
 */
export function MarketingConsentCard({ subscribed }: MarketingConsentCardProps) {
  const [current, setCurrent] = useState(subscribed);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !current;
    const previous = current;
    setCurrent(next);
    setSaving(true);
    try {
      const res = await fetch('/api/candidate/consents/marketing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribed: next, source: 'profile_toggle' }),
      });
      if (!res.ok) setCurrent(previous);
    } catch {
      setCurrent(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-[15px] font-bold text-ink mb-3">Comunicaciones de marketing</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-ink-subtle" />
          <div>
            <p className="text-[14px] text-ink font-medium mb-0.5">
              {current ? 'Recibiendo novedades' : 'No recibes novedades'}
            </p>
            <p className="text-[12px] text-ink-subtle">
              Vacantes nuevas y novedades de Integrity Solutions por correo.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={saving}
          className="h-9 px-4 bg-card border border-border text-ink font-semibold text-[13px] rounded-lg hover:bg-primary-50 transition-colors shrink-0 disabled:opacity-60"
        >
          {current ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
