'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, FileText } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { applyToVacancy } from '../api/candidateApi';
import { ROUTES } from '@/shared/constants/routes';

interface ApplicationModalProps {
  vacancyId: string;
  vacancyTitle: string;
  clientName: string;
  clientInitials: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationModal({
  vacancyId,
  vacancyTitle,
  clientName,
  clientInitials,
  onClose,
  onSuccess,
}: ApplicationModalProps) {
  const [salary, setSalary] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = salary.trim() !== '' && agreed && !loading;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await applyToVacancy(vacancyId, Number(salary));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-[480px] p-6">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 size={56} className="text-success" />
            <div>
              <p className="font-bold text-xl text-ink">¡Postulación enviada!</p>
              <p className="text-ink-muted text-sm mt-2 max-w-xs">
                Tu postulación fue enviada exitosamente. El equipo de Talento Humano revisará tu
                perfil.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-sm text-ink-muted w-full text-left bg-surface-2 rounded-lg p-4">
              <span>✓ CV adjuntado</span>
              <span>✓ Perfil enviado</span>
              <span>✓ Notificación enviada</span>
            </div>
            <Button className="w-full" asChild>
              <Link href={ROUTES.candidato.misPostulaciones} onClick={onSuccess}>
                Ver mis postulaciones →
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-100 text-primary-700 font-bold text-xs shrink-0">
                  {clientInitials}
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm leading-tight">{vacancyTitle}</p>
                  <p className="text-xs text-ink-muted">{clientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-ink-subtle hover:text-ink transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <hr className="border-border mb-4" />

            <p className="font-semibold text-ink mb-3">Confirma tu postulación</p>

            <div className="bg-surface-2 rounded-lg p-4 flex flex-col gap-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-ink-muted">
                <span className="text-xs font-medium text-ink-subtle">Candidato</span>
                <span className="text-ink">Juan Pérez</span>
              </div>
              <div className="flex items-center gap-2 text-ink-muted">
                <FileText size={13} className="shrink-0" />
                <span className="text-ink">CV_Juan.pdf</span>
              </div>
              <div className="flex items-center gap-2 text-ink-muted">
                <span className="text-xs font-medium text-ink-subtle">Vacante</span>
                <span className="text-ink">{vacancyTitle}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <Label htmlFor="modal-salary" className="text-xs font-semibold tracking-wide">
                PRETENSIÓN SALARIAL *
              </Label>
              <div className="flex items-center gap-0">
                <span className="inline-flex h-9 items-center px-3 rounded-l-md border border-r-0 border-border bg-surface-2 text-sm text-ink-muted">
                  $
                </span>
                <Input
                  id="modal-salary"
                  type="number"
                  placeholder="0"
                  className="rounded-none flex-1"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
                <span className="inline-flex h-9 items-center px-3 rounded-r-md border border-l-0 border-border bg-surface-2 text-xs text-ink-muted whitespace-nowrap">
                  USD / mes
                </span>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-ink-muted cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-primary-600"
              />
              <span>
                Entiendo que mis datos serán procesados para evaluar mi perfil
              </span>
            </label>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!canSubmit}
                onClick={handleConfirm}
              >
                {loading ? 'Enviando…' : 'Confirmar postulación'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
