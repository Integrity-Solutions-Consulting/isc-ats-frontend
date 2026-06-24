'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { passwordPolicyError } from '@/shared/utils/ecuadorValidators';

export function PasswordModal({ onClose }: { onClose: () => void }) {
  const modalId = 'pw-modal';
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const nextPolicyError = form.next.length > 0 ? passwordPolicyError(form.next) : null;
  const valid =
    form.current.length > 0 &&
    nextPolicyError === null &&
    form.next.length > 0 &&
    form.next === form.confirm &&
    form.next !== form.current;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'No se pudo cambiar la contraseña.');
        return;
      }
      setSaved(true);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  // The backend revokes all refresh tokens on a password change, so the session
  // must be re-established. Clear cookies and send the user to login.
  const handleReLogin = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        {saved ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="size-7 text-success" />
            </div>
            <h2 className="text-lg font-bold text-ink">Contraseña actualizada</h2>
            <p className="text-sm text-ink-muted">
              Tu contraseña fue cambiada exitosamente. Por seguridad, vuelve a iniciar sesión.
            </p>
            <Button className="w-full" onClick={handleReLogin}>Ir a iniciar sesión</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-ink">Cambiar contraseña</h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="text-ink-subtle hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {([
                { key: 'current', label: 'Contraseña actual' },
                { key: 'next', label: 'Nueva contraseña' },
                { key: 'confirm', label: 'Confirmar nueva contraseña' },
              ] as const).map(({ key, label }) => {
                const fieldId = `${modalId}-${key}`;
                return (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={fieldId}>{label}</Label>
                  <div className="relative">
                    <Input
                      id={fieldId}
                      type={show[key] ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form[key]}
                      onChange={set(key)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={show[key] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => toggle(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                    >
                      {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {key === 'next' && nextPolicyError && (
                    <p className="text-xs text-danger">{nextPolicyError}</p>
                  )}
                  {key === 'next' && !nextPolicyError && form.next.length > 0 &&
                    form.next === form.current && (
                    <p className="text-xs text-danger">
                      La nueva contraseña debe ser distinta a la actual
                    </p>
                  )}
                  {key === 'confirm' && form.confirm && form.next !== form.confirm && (
                    <p className="text-xs text-danger">Las contraseñas no coinciden</p>
                  )}
                </div>
                );
              })}
            </div>

            {error && (
              <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button className="flex-1" disabled={!valid || saving} onClick={handleSave}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
