'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { cn } from '@/shared/utils';

export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/candidate/account', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Error al cerrar la cuenta');
      }
      // Full navigation so session cookies are dropped by the browser
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">Cerrar mi cuenta</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="text-ink-subtle hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-lg bg-danger/5 border border-danger/20 p-4 mb-5">
          <p className="text-sm text-ink font-medium mb-1">Al cerrar tu cuenta:</p>
          <ul className="text-sm text-ink-muted space-y-1 list-disc list-inside">
            <li>Tu cuenta se desactiva y perdés el acceso al portal</li>
            <li>Se cierran tus postulaciones activas</li>
            <li>Conservamos tu perfil e historial conforme a nuestra Política de Privacidad</li>
            <li>Podés reactivar tu cuenta más adelante registrándote con el mismo correo</li>
          </ul>
        </div>

        <div className="space-y-1.5 mb-5">
          <Label htmlFor="delete-confirm-input">Para confirmar, escribe <span className="font-semibold text-ink">CERRAR</span></Label>
          <Input
            id="delete-confirm-input"
            placeholder="CERRAR"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={cn(confirm === 'CERRAR' && 'border-danger focus-visible:ring-danger/30')}
          />
        </div>

        {error && (
          <p className="text-sm text-danger mb-4">{error}</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 bg-danger hover:bg-danger/90 text-white"
            disabled={confirm !== 'CERRAR' || deleting}
            onClick={handleDelete}
          >
            {deleting ? 'Cerrando…' : 'Cerrar cuenta'}
          </Button>
        </div>
      </div>
    </div>
  );
}
