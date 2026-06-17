'use client';

import { useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/design-system/ui/button';

export interface CvPrefillData {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  cityId?: number | null;
  provinceId?: number | null;
  educationLevelId?: number | null;
  careerId?: number | null;
  universityId?: number | null;
}

export function Step0CvUpload({
  onComplete,
  onSkip,
}: {
  onComplete: (prefillData: CvPrefillData, cvFileId: number) => void;
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

    let cvFileId: number | undefined;

    try {
      // Step 1: upload the PDF to storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/candidate/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error ?? 'Error al subir el CV');
      }

      const uploadData = (await uploadRes.json()) as { id: number };
      cvFileId = uploadData.id;

      // Step 2: extract prefill data with AI
      const prefillRes = await fetch('/api/candidate/cv/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: cvFileId }),
      });

      const prefillData: CvPrefillData = prefillRes.ok
        ? ((await prefillRes.json()) as CvPrefillData)
        : {};

      setLoading(false);
      onComplete(prefillData, cvFileId);
    } catch {
      setLoading(false);
      setError('No pudimos analizar tu hoja de vida. Podés continuar sin pre-llenado.');
      if (cvFileId !== undefined) {
        onComplete({}, cvFileId);
      }
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
          className="relative rounded-lg border-2 border-dashed border-primary-300/60 bg-primary-50/30 p-8 text-center"
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

      <div className="rounded-md border-l-2 border-primary-600 bg-primary-50 px-4 py-3 text-sm text-primary-700">
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

      <button
        type="button"
        onClick={onSkip}
        disabled={loading}
        className="w-full text-center text-xs text-ink-subtle hover:text-ink transition-colors disabled:opacity-40"
      >
        Saltar por ahora
      </button>
    </div>
  );
}
