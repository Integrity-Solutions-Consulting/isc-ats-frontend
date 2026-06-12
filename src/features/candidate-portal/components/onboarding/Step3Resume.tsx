'use client';

import { CheckCircle2, Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { type Step3Data } from './schemas';

export function Step3Resume({ data, onChange, onNext, onBack, onSkip, isSubmitting, isUploading }: {
  data: Step3Data;
  onChange: (d: Step3Data) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  isUploading: boolean;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') onChange({ file });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange({ file });
  };

  const fileSizeKB = data.file ? Math.round(data.file.size / 1024) : 0;

  const buttonLabel = isUploading
    ? 'Subiendo CV…'
    : isSubmitting
    ? 'Guardando perfil…'
    : 'Finalizar registro →';

  return (
    <div className="space-y-4">
      {data.file ? (
        <div className="flex items-center gap-3 rounded-lg border border-success bg-success/5 p-4">
          <FileText className="size-8 shrink-0 text-danger" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{data.file.name}</p>
            <p className="text-xs text-ink-muted">{fileSizeKB} KB</p>
          </div>
          {isUploading ? (
            <Loader2 className="size-5 shrink-0 text-primary-600 animate-spin" />
          ) : (
            <CheckCircle2 className="size-5 shrink-0 text-success" />
          )}
          <button
            type="button"
            aria-label="Quitar CV seleccionado"
            onClick={() => onChange({ file: null })}
            disabled={isSubmitting}
            className="text-ink-subtle hover:text-danger transition-colors disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-lg border-2 border-dashed border-primary-300/60 bg-primary-50/30 p-8 text-center"
        >
          <Upload className="mx-auto mb-3 size-8 text-ink-subtle" />
          <p className="text-sm font-medium text-ink mb-1">Arrastra tu CV aquí</p>
          <p className="text-xs text-ink-muted mb-3">o</p>
          <label className="cursor-pointer text-sm font-medium text-primary-600 hover:underline">
            Seleccionar archivo
            <input type="file" accept="application/pdf" className="sr-only" onChange={handleInput} />
          </label>
          <p className="mt-3 text-xs text-ink-subtle">Solo PDF · Máximo 5 MB · 1 a 10 páginas</p>
        </div>
      )}

      <div className="rounded-md border-l-2 border-primary-600 bg-primary-50 px-4 py-3 text-sm text-primary-700">
        Tu CV solo será compartido con empresas cuando postules a una vacante.
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="w-2/5" onClick={onBack} disabled={isSubmitting}>
          ← Atrás
        </Button>
        <Button
          className="w-3/5 flex items-center justify-center gap-2"
          onClick={onNext}
          disabled={!data.file || isSubmitting}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {buttonLabel}
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={isSubmitting}
        className="w-full text-center text-xs text-ink-subtle hover:text-ink transition-colors"
      >
        ¿No tienes tu CV a la mano?{' '}
        <span className="underline">Completarlo después</span>
      </button>
    </div>
  );
}
