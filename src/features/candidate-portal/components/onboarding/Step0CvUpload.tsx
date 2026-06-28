'use client';

import { useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/design-system/ui/button';

export interface CvPrefillData {
  firstName?: string | null;
  lastName?: string | null;
  idNumber?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  homeAddress?: string | null;
  currentCompany?: string | null;
  cityId?: number | null;
  educationLevelId?: number | null;
  careerId?: number | null;
  titleId?: number | null;
  universityId?: number | null;
}

export function Step0CvUpload({
  onComplete,
  onSkip,
}: {
  onComplete: (prefillData: CvPrefillData, cvFile: File) => void;
  onSkip: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setFile(dropped);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleContinue = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      // Extract prefill data in memory. The CV is NOT stored here — it is only
      // persisted when the candidate finishes registration (data minimisation).
      // The File object is kept in state and handed upward for later upload.
      const formData = new FormData();
      formData.append('file', file);

      const prefillRes = await fetch('/api/candidate/cv/prefill', {
        method: 'POST',
        body: formData,
      });

      const prefillData: CvPrefillData = prefillRes.ok
        ? ((await prefillRes.json()) as CvPrefillData)
        : {};

      setLoading(false);
      onComplete(prefillData, file);
    } catch {
      setLoading(false);
      setError('No pudimos analizar tu hoja de vida. Podés continuar sin pre-llenado.');
      // Keep going with the file so it still gets stored when registration ends.
      onComplete({}, file);
    }
  };

  const fileSizeKB = file ? Math.round(file.size / 1024) : 0;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-success bg-success/5 p-4">
          <FileText className="size-8 shrink-0 text-danger" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{file.name}</p>
            <p className="text-xs text-ink-muted">{fileSizeKB} KB</p>
          </div>
          {loading ? (
            <Loader2 className="size-5 shrink-0 text-primary-600 animate-spin" />
          ) : (
            <button
              type="button"
              aria-label="Quitar CV seleccionado"
              onClick={() => setFile(null)}
              className="text-ink-subtle hover:text-danger transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative rounded-lg border-2 border-dashed border-primary-300/60 bg-surface-2/50 p-8 text-center"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 text-primary-600 animate-spin" />
              <p className="text-sm text-ink-muted">Analizando tu hoja de vida...</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto mb-3 size-8 text-ink-subtle" />
              <p className="text-sm font-medium text-ink mb-1">Arrastra tu CV aquí</p>
              <p className="text-xs text-ink-muted mb-3">o</p>
              <label className="cursor-pointer text-sm font-medium text-primary-600 hover:underline">
                Seleccionar archivo
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  onChange={handleInput}
                />
              </label>
              <p className="mt-3 text-xs text-ink-subtle">Solo PDF · Máximo 5 MB · 1 a 10 páginas</p>
            </>
          )}
        </div>
      )}

      {loading && file && (
        <p className="text-center text-sm text-ink-muted">Analizando tu hoja de vida...</p>
      )}

      <div className="rounded-md border-l-2 border-primary-600 bg-surface-2 px-4 py-3 text-sm text-ink-muted">
        Usaremos tu CV para pre-completar el formulario. Tu información está protegida.
      </div>

      <Button
        className="w-full"
        onClick={handleContinue}
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Analizando...
          </>
        ) : (
          'Continuar →'
        )}
      </Button>

    </div>
  );
}
