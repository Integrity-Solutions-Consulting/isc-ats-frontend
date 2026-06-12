'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, Eye, FileText, Loader2, Upload } from 'lucide-react';
import type { CandidateProfile } from '../../types';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function ResumeCard({ profile }: { profile: CandidateProfile }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDownload = () => {
    window.open(`/api/candidate/cv/${profile.cvFileId}`, '_blank');
  };

  const handleView = () => {
    window.open(`/api/candidate/cv/${profile.cvFileId}?view=1`, '_blank');
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('El archivo no puede superar 5 MB.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      // Phase 1: upload to MinIO
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/candidate/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Error al subir el archivo');
      }
      const { id: cvFileId } = await uploadRes.json() as { id: number };

      // Phase 2: link to candidate profile
      const patchRes = await fetch('/api/candidate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvFileId, candidateId: profile.id }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Error al actualizar el perfil');
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="bg-white rounded-xl border border-primary-200 p-6">
      <h3 className="text-[15px] font-bold text-primary-800 mb-3">Hoja de vida</h3>

      {profile.cvFileId ? (
        <>
          <div className="w-full bg-surface-2 rounded-lg p-3 mb-2 flex items-center gap-3">
            <FileText className="w-6 h-6 text-danger shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] text-primary-800 font-medium truncate">
                {profile.cvFileName}
              </p>
              <p className="text-[11px] text-ink-subtle">
                {profile.cvSizeKb} KB
                {profile.cvUpdatedDaysAgo === 0
                  ? ' · subido hoy'
                  : ` · hace ${profile.cvUpdatedDaysAgo} día${profile.cvUpdatedDaysAgo === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleView}
                title="Ver CV"
                className="p-1.5 rounded-md text-ink-subtle hover:text-primary-700 hover:bg-primary-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                title="Descargar CV"
                className="p-1.5 rounded-md text-ink-subtle hover:text-primary-700 hover:bg-primary-50 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-success" />
            <p className="text-[12px] text-success font-medium">CV verificado y procesado</p>
          </div>
        </>
      ) : (
        <p className="text-[13px] text-ink-subtle mb-3">No has subido tu CV aún.</p>
      )}

      {error && (
        <p className="text-[12px] text-danger mb-2">{error}</p>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg h-[110px] flex flex-col items-center justify-center transition-colors ${
          dragOver
            ? 'border-primary-600 bg-primary-50'
            : 'border-primary-700/40 bg-primary-700/[0.02]'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-primary-700 mb-2 animate-spin" />
            <p className="text-[13px] text-primary-800">Subiendo CV…</p>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-primary-700 mb-2" />
            <p className="text-[13px] text-primary-800 mb-1">
              {profile.cvFileId ? 'Reemplazar CV' : 'Subir CV'}
            </p>
            <p className="text-[13px] text-ink-subtle">
              o{' '}
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="text-primary-700 font-medium hover:text-primary-600 disabled:opacity-40"
              >
                seleccionar archivo
              </button>
            </p>
            <p className="text-[11px] text-ink-subtle mt-1">PDF · Máx 5MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={onInputChange}
      />
    </div>
  );
}
