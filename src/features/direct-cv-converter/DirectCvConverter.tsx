'use client';

import { DragEvent, useRef, useState } from 'react';
import { Download, FileDown, FileText, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';

type Experience = { company?: string; role?: string; start_date?: string; end_date?: string; functions?: string[]; tools?: string[] };
type Certification = { institution?: string; name?: string; start?: string; end?: string };
type Project = { name?: string; description?: string; tools?: string[] };
type Preview = {
  firstName?: string | null; lastName?: string | null; idNumber?: string | null;
  phone?: string | null; email?: string | null; homeAddress?: string | null; currentCompany?: string | null;
  catalogNames?: Record<string, string>;
  warnings?: string[];
  parsedData?: { experience?: Experience[]; skills?: string[]; tools?: string[]; soft_skills?: string[]; certifications?: Certification[]; projects?: Project[] };
};

const MAX_SIZE = 5 * 1024 * 1024;

export function DirectCvConverter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseFile = (next?: File) => {
    if (!next) return;
    if (next.type !== 'application/pdf' && !next.name.toLowerCase().endsWith('.pdf')) return setError('Solo se aceptan archivos PDF.');
    if (next.size > MAX_SIZE) return setError('El archivo no puede superar 5 MB.');
    setFile(next); setPreview(null); setDocumentBase64(null); setError(null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragOver(false); chooseFile(event.dataTransfer.files[0]); };
  const clearFile = () => { setFile(null); setPreview(null); setDocumentBase64(null); setError(null); if (inputRef.current) inputRef.current.value = ''; };

  const convert = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch('/api/ai/direct-cv-converter', { method: 'POST', body: form });
      const data = await response.json() as { error?: string; preview?: Preview; documentBase64?: string };
      if (!response.ok || !data.preview || !data.documentBase64) throw new Error(data.error ?? 'No se pudo convertir la hoja de vida.');
      setPreview(data.preview); setDocumentBase64(data.documentBase64);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo convertir la hoja de vida.'); }
    finally { setLoading(false); }
  };

  const download = () => {
    if (!documentBase64) return;
    const bytes = Uint8Array.from(atob(documentBase64), (char) => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `perfil_${file?.name.replace(/\.pdf$/i, '') ?? 'convertido'}.docx`; anchor.click(); URL.revokeObjectURL(url);
  };

  const parsed = preview?.parsedData;
  const skills = [...new Set([...(parsed?.skills ?? []), ...(parsed?.tools ?? [])])];
  const fullName = [preview?.firstName, preview?.lastName].filter(Boolean).join(' ');
  const sectionCount = (parsed?.experience?.length ?? 0) + (parsed?.certifications?.length ?? 0) + (parsed?.projects?.length ?? 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div><h1 className="text-2xl font-bold text-ink">Convertir CV</h1><p className="mt-1 text-sm text-ink-muted">Convierte una hoja de vida al formato corporativo y revisa el resultado antes de descargarlo.</p></div>
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-ink">Cargar hoja de vida</h2><p className="mb-4 text-xs text-ink-muted">Arrastra un PDF al recuadro o selecciónalo desde tu equipo.</p>
          <div onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }} className={`cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition-colors ${dragOver ? 'border-primary-600 bg-primary/10' : 'border-primary-300/70 bg-surface-2/50 hover:border-primary-500 hover:bg-primary/5'}`}>
            {file ? <FileText className="mx-auto mb-3 size-10 text-danger" /> : <Upload className="mx-auto mb-3 size-10 text-primary-600" />}
            <p className="truncate text-sm font-semibold text-ink">{file?.name ?? 'Suelta aquí tu CV'}</p><p className="mt-1 text-xs text-ink-muted">{file ? `${Math.round(file.size / 1024)} KB · PDF` : 'o haz clic para seleccionar · máximo 5 MB'}</p>
          </div>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
          {file && <button type="button" onClick={clearFile} className="mt-3 flex items-center gap-1 text-xs text-ink-subtle hover:text-danger"><X className="size-3" />Quitar archivo</button>}
          {error && <p className="mt-4 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <Button className="mt-5 w-full" disabled={!file || loading} onClick={convert}>{loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Analizando y generando...</> : <><FileDown className="mr-2 size-4" />Convertir al formato empresarial</>}</Button>
          {loading && <p className="mt-3 text-center text-xs text-ink-muted">Estamos leyendo todas las secciones del CV. Esto puede tardar unos segundos.</p>}
        </section>

        <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div><h2 className="text-base font-semibold text-ink">Vista previa del perfil</h2><p className="text-xs text-ink-muted">{preview ? `${sectionCount} elementos identificados` : 'El resultado aparecerá después de convertir el CV.'}</p></div>{documentBase64 && <Button variant="outline" onClick={download}><Download className="mr-2 size-4" />Descargar Word</Button>}</div>
          {!preview ? <div className="flex min-h-96 items-center justify-center rounded-lg bg-surface-2 p-8 text-center text-sm text-ink-subtle">Aquí podrás revisar los datos antes de descargar el documento.</div> : (
            <div className="space-y-5">
              {preview.warnings?.length ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground"><p className="font-semibold">Revisión recomendada</p><ul className="mt-1 list-disc pl-5">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
              <div className="rounded-lg border border-primary-200 bg-primary/5 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Datos personales</p><h3 className="mt-1 text-xl font-bold text-ink">{fullName || 'Nombre no identificado'}</h3><div className="mt-3 grid gap-1 text-sm text-ink-muted sm:grid-cols-2"><span>{preview.phone || 'Teléfono no identificado'}</span><span>{preview.idNumber || 'Documento no identificado'}</span><span>{preview.catalogNames?.cityId || 'Ciudad no identificada'}</span><span>{preview.catalogNames?.universityId || 'Universidad no identificada'}</span><span>{preview.catalogNames?.titleId || 'Título no identificado'}</span><span>{preview.homeAddress || 'Dirección no identificada'}</span></div></div>
              <PreviewSection title={`Experiencia relevante (${parsed?.experience?.length ?? 0})`} empty="No se identificó experiencia laboral.">{parsed?.experience?.map((item, index) => <div key={index} className="rounded-lg border border-border p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-ink">{item.role || 'Cargo no identificado'}</p><p className="text-xs text-ink-muted">{[item.start_date, item.end_date].filter(Boolean).join(' — ')}</p></div><p className="mt-1 text-sm text-primary-700">{item.company || 'Empresa no identificada'}</p>{item.functions?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">{item.functions.map((item, i) => <li key={i}>{item}</li>)}</ul> : null}{item.tools?.length ? <p className="mt-2 text-xs text-ink-subtle">Herramientas: {item.tools.join(' · ')}</p> : null}</div>)}</PreviewSection>
              <div className="grid gap-5 md:grid-cols-2"><PreviewSection title="Conocimientos técnicos" empty="No se identificaron conocimientos."><div className="flex flex-wrap gap-2">{skills.map((item) => <span key={item} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary-700">{item}</span>)}</div></PreviewSection><PreviewSection title="Habilidades" empty="No se identificaron habilidades."><div className="flex flex-wrap gap-2">{(parsed?.soft_skills ?? []).map((item) => <span key={item} className="rounded-full bg-success/10 px-3 py-1 text-xs text-success">{item}</span>)}</div></PreviewSection></div>
              <div className="grid gap-5 md:grid-cols-2"><PreviewSection title={`Cursos y certificaciones (${parsed?.certifications?.length ?? 0})`} empty="No se identificaron certificaciones.">{parsed?.certifications?.map((item, index) => <div key={index} className="border-b border-border py-2 last:border-0"><p className="font-medium">{item.name || 'Curso no identificado'}</p><p className="text-xs text-ink-muted">{item.institution || 'Institución no identificada'}{item.start || item.end ? ` · ${[item.start, item.end].filter(Boolean).join(' — ')}` : ''}</p></div>)}</PreviewSection><PreviewSection title={`Proyectos (${parsed?.projects?.length ?? 0})`} empty="No se identificaron proyectos.">{parsed?.projects?.map((item, index) => <div key={index} className="border-b border-border py-2 last:border-0"><p className="font-medium">{item.name || 'Proyecto no identificado'}</p><p className="mt-1 text-xs text-ink-muted">{item.description}</p></div>)}</PreviewSection></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PreviewSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div className="rounded-lg border border-border p-4"><h3 className="mb-3 font-semibold text-ink">{title}</h3>{hasContent ? children : <p className="text-sm text-ink-subtle">{empty}</p>}</div>;
}
