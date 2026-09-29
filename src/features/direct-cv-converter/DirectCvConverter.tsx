'use client';

import { useRef, useState } from 'react';
import { Download, FileDown, FileText, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';

type Preview = {
  firstName?: string | null;
  lastName?: string | null;
  idNumber?: string | null;
  phone?: string | null;
  homeAddress?: string | null;
  catalogNames?: Record<string, string>;
  parsedData?: {
    experience?: { company?: string; role?: string; start_date?: string; end_date?: string }[];
    skills?: string[];
    tools?: string[];
    soft_skills?: string[];
    certifications?: { institution?: string; name?: string }[];
    projects?: { name?: string; description?: string }[];
  };
};

export function DirectCvConverter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseFile = (next: File | undefined) => {
    if (!next) return;
    if (next.type !== 'application/pdf') return setError('Solo se aceptan archivos PDF.');
    if (next.size > 5 * 1024 * 1024) return setError('El archivo no puede superar 5 MB.');
    setFile(next);
    setPreview(null);
    setDocumentBase64(null);
    setError(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/ai/direct-cv-converter', { method: 'POST', body: form });
      const data = await response.json() as { error?: string; preview?: Preview; documentBase64?: string };
      if (!response.ok || !data.preview || !data.documentBase64) {
        throw new Error(data.error ?? 'No se pudo convertir la hoja de vida.');
      }
      setPreview(data.preview);
      setDocumentBase64(data.documentBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo convertir la hoja de vida.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!documentBase64) return;
    const bytes = Uint8Array.from(atob(documentBase64), (char) => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `perfil_${file?.name.replace(/\.pdf$/i, '') ?? 'convertido'}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const parsed = preview?.parsedData;
  const skills = [...(parsed?.skills ?? []), ...(parsed?.tools ?? [])];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Convertir CV</h1>
        <p className="mt-1 text-sm text-ink-muted">Sube una hoja de vida y conviértela al formato de Integrity Solutions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-ink">Cargar hoja de vida</h2>
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-success bg-success/5 p-4">
              <FileText className="size-8 shrink-0 text-danger" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="text-xs text-ink-muted">{Math.round(file.size / 1024)} KB</p>
              </div>
              <button type="button" aria-label="Quitar archivo" onClick={() => { setFile(null); setPreview(null); setDocumentBase64(null); }}>
                <X className="size-4 text-ink-subtle" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-primary-300/60 bg-surface-2/50 p-10 text-center"
            >
              <Upload className="mb-3 size-8 text-primary-600" />
              <span className="text-sm font-medium text-ink">Seleccionar CV en PDF</span>
              <span className="mt-1 text-xs text-ink-muted">Máximo 5 MB</span>
            </button>
          )}
          <input ref={inputRef} type="file" accept="application/pdf" className="sr-only" onChange={(e) => chooseFile(e.target.files?.[0])} />
          {error && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <Button className="mt-5 w-full" disabled={!file || loading} onClick={convert}>
            {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Convirtiendo...</> : <><FileDown className="mr-2 size-4" />Convertir al formato empresarial</>}
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Vista previa</h2>
              <p className="text-xs text-ink-muted">Información que se incorporará al documento.</p>
            </div>
            {documentBase64 && <Button variant="outline" onClick={download}><Download className="mr-2 size-4" />Descargar Word</Button>}
          </div>
          {!preview ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg bg-surface-2 p-6 text-center text-sm text-ink-subtle">La vista previa aparecerá después de convertir el CV.</div>
          ) : (
            <div className="space-y-5 text-sm text-ink">
              <div className="rounded-lg bg-surface-2 p-4">
                <h3 className="mb-2 font-semibold">Datos personales</h3>
                <p className="text-lg font-medium">{[preview.firstName, preview.lastName].filter(Boolean).join(' ') || 'No identificado'}</p>
                <p>{preview.phone || 'Teléfono no identificado'} · {preview.idNumber || 'Documento no identificado'}</p>
                <p>{preview.catalogNames?.cityId || 'Ciudad no identificada'} · {preview.catalogNames?.universityId || 'Universidad no identificada'}</p>
              </div>
              <div><h3 className="mb-2 font-semibold">Experiencia ({parsed?.experience?.length ?? 0})</h3><div className="space-y-2">{parsed?.experience?.map((item, i) => <div key={i} className="rounded border border-border p-3"><p className="font-medium">{item.role || 'Cargo no identificado'} — {item.company || 'Empresa no identificada'}</p><p className="text-xs text-ink-muted">{item.start_date || ''} {item.end_date ? `- ${item.end_date}` : ''}</p></div>)}</div></div>
              {skills.length > 0 && <div><h3 className="mb-2 font-semibold">Conocimientos</h3><p className="text-ink-muted">{skills.join(' · ')}</p></div>}
              {(parsed?.projects?.length ?? 0) > 0 && <div><h3 className="mb-2 font-semibold">Proyectos</h3><p className="text-ink-muted">{parsed?.projects?.map((p) => p.name).filter(Boolean).join(' · ')}</p></div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
