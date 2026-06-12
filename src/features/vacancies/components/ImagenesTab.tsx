'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ImageOff, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import type { Vacancy } from '@/features/vacancies/types';

// ─── Types ────────────────────────────────────────────────────────────────

interface GeneratedImage {
  id: string;
  version: number;
  blobUrl: string;
  generatedAt: string;
}

// ─── Image card ───────────────────────────────────────────────────────────

function ImageCard({
  image,
  onDelete,
}: {
  image: GeneratedImage;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-surface shadow-sm w-[220px] shrink-0">
      <img
        src={image.blobUrl}
        alt={`Póster versión ${image.version}`}
        className="w-[220px] h-[280px] object-cover"
      />
      <div className="p-3 border-t border-dashed border-border flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">Versión {image.version}</p>
          <p className="text-xs text-ink-muted">{image.generatedAt}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={image.blobUrl}
            download={`poster_v${image.version}.png`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Download size={12} />
              Descargar
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            className="text-danger hover:bg-danger/10 hover:text-danger px-2"
            onClick={() => onDelete(image.id)}
            aria-label="Eliminar imagen"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Generating skeleton ──────────────────────────────────────────────────

function GeneratingSkeleton() {
  return (
    <div className="flex flex-col border border-primary-200 rounded-xl overflow-hidden bg-primary-50 shadow-sm w-[220px] shrink-0 animate-pulse">
      <div className="w-[220px] h-[280px] flex flex-col items-center justify-center gap-3 bg-primary-100">
        <Loader2 size={28} className="text-primary-600 animate-spin" />
        <p className="text-xs font-medium text-primary-700">Generando imagen…</p>
        <p className="text-[10px] text-primary-500 text-center px-4">
          La IA está creando la imagen publicitaria con los datos de la vacante
        </p>
      </div>
      <div className="p-3 border-t border-dashed border-primary-200">
        <div className="h-3 w-16 bg-primary-200 rounded mb-1.5" />
        <div className="h-2.5 w-24 bg-primary-100 rounded" />
      </div>
    </div>
  );
}

// ─── Base image upload section ────────────────────────────────────────────

function BaseImageUpload({
  vacancyId,
  baseImageName,
  uploading,
  onUpload,
}: {
  vacancyId: string;
  baseImageName: string | null;
  uploading: boolean;
  onUpload: (name: string | null, error: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch(`/api/recruitment/vacancies/${vacancyId}/upload-image`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
          const body = await res.json();
          if (body?.detail) msg = String(body.detail);
        } catch { /* ignore */ }
        onUpload(null, msg);
      } else {
        onUpload(file.name, null);
      }
    } catch (err) {
      onUpload(null, err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      // Reset so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        id={`base-image-upload-${vacancyId}`}
        onChange={handleFileChange}
        disabled={uploading}
      />
      <label
        htmlFor={`base-image-upload-${vacancyId}`}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 pointer-events-none"
          disabled={uploading}
          asChild={false}
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? 'Subiendo…' : 'Subir imagen base'}
        </Button>
      </label>
      <div className="flex flex-col min-w-0">
        <p className="text-xs font-medium text-ink truncate">
          {baseImageName ?? 'Sin imagen base'}
        </p>
        <p className="text-[10px] text-ink-subtle">
          {baseImageName
            ? 'La próxima generación usará esta imagen como fondo'
            : 'Opcional · el póster usará el fondo degradado de marca si no se sube imagen'}
        </p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center min-h-[300px]">
      <ImageOff size={40} className="text-ink-subtle opacity-40" />
      <div>
        <p className="font-semibold text-ink-muted">No hay imágenes generadas aún</p>
        <p className="text-sm text-ink-subtle mt-1">
          Genera la primera imagen publicitaria para esta vacante
        </p>
      </div>
      <Button onClick={onGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {loading ? 'Generando…' : 'Generar primera imagen'}
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export function ImagenesTab({ vacancy }: { vacancy: Vacancy }) {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [baseImageName, setBaseImageName] = useState<string | null>(null);
  const blobUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      blobUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const nextVersion = images.length > 0 ? Math.max(...images.map((i) => i.version)) + 1 : 1;

  const handleUpload = (name: string | null, err: string | null) => {
    setUploading(false);
    if (err) {
      setUploadError(`No fue posible subir la imagen: ${err}`);
    } else {
      setBaseImageName(name);
      setUploadError(null);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/recruitment/vacancies/${vacancy.id}/generate-poster`);
      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
          const body = await res.json();
          if (body?.detail) msg = String(body.detail);
        } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobUrls.current.push(blobUrl);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
      setImages((prev) => [
        { id: `img-${Date.now()}`, version: nextVersion, blobUrl, generatedAt: `Hoy · ${timeStr}` },
        ...prev,
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No fue posible generar la imagen: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    setImages((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.blobUrl);
        blobUrls.current = blobUrls.current.filter((u) => u !== removed.blobUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  if (images.length === 0 && !generating) {
    return (
      <div className="flex flex-col gap-4">
        <BaseImageUpload
          vacancyId={vacancy.id}
          baseImageName={baseImageName}
          uploading={uploading}
          onUpload={handleUpload}
        />
        {uploadError && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{uploadError}</p>
        )}
        <EmptyState onGenerate={handleGenerate} loading={generating} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BaseImageUpload
        vacancyId={vacancy.id}
        baseImageName={baseImageName}
        uploading={uploading}
        onUpload={handleUpload}
      />
      {uploadError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{uploadError}</p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">
            {images.length} imagen{images.length !== 1 ? 'es' : ''} generada{images.length !== 1 ? 's' : ''}
            {' · '}
            <span className="font-semibold text-ink">Generar imagen</span> en la barra superior para crear una nueva versión
          </p>
          <p className="text-xs text-ink-subtle mt-0.5">
            Las imágenes se eliminan al salir de la página — descargalas antes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {generating ? 'Generando…' : 'Nueva versión'}
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex flex-wrap gap-5 items-start">
        {generating && <GeneratingSkeleton />}
        {images.map((image) => (
          <ImageCard key={image.id} image={image} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
