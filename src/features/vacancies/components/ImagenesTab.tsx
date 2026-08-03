'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, ImageOff, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { PERM } from '@/features/auth/permissions';
import { usePermissions } from '@/features/auth/PermissionsProvider';
import type { Vacancy } from '@/features/vacancies/types';

// ─── Types ────────────────────────────────────────────────────────────────

interface PromoImageItem {
  id: number;
  vacancy_id: number;
  file_id: number;
  created_at: string;
}

interface GeneratedImage {
  id: string;
  version: number;
  imageUrl: string;
  generatedAt: string;
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timePart = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
}

// Backend has no version counter — it's derived here from creation order.
// Oldest first to number versions, then reversed so the newest render first.
function toGeneratedImages(items: PromoImageItem[]): GeneratedImage[] {
  const oldestFirst = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return oldestFirst
    .map((item, index) => ({
      id: String(item.id),
      version: index + 1,
      imageUrl: `/api/candidate/cv/${item.file_id}?view=1`,
      generatedAt: formatGeneratedAt(item.created_at),
    }))
    .reverse();
}

// ─── Image card ───────────────────────────────────────────────────────────

function ImageCard({
  image,
  canDelete,
  onDelete,
}: {
  image: GeneratedImage;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-surface shadow-sm w-[220px] shrink-0">
      <img
        src={image.imageUrl}
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
            href={image.imageUrl}
            download={`poster_v${image.version}.png`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Download size={12} />
              Descargar
            </Button>
          </a>
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-danger hover:bg-danger/10 hover:text-danger px-2"
              onClick={() => onDelete(image.id)}
              aria-label="Eliminar imagen"
            >
              <Trash2 size={12} />
            </Button>
          )}
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
        let msg = 'No se pudo subir la imagen.';
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

function EmptyState({
  canCreate,
  onGenerate,
  loading,
}: {
  canCreate: boolean;
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-surface/50 p-12 text-center min-h-[300px]">
      <ImageOff size={40} className="text-ink-subtle opacity-40" />
      <div>
        <p className="font-semibold text-ink-muted">No hay imágenes generadas aún</p>
        {canCreate && (
          <p className="text-sm text-ink-subtle mt-1">
            Genera la primera imagen publicitaria para esta vacante
          </p>
        )}
      </div>
      {canCreate && (
        <Button onClick={onGenerate} disabled={loading} className="gap-2">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {loading ? 'Generando…' : 'Generar primera imagen'}
        </Button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export function ImagenesTab({ vacancy }: { vacancy: Vacancy }) {
  const queryClient = useQueryClient();
  const { has } = usePermissions();
  const canCreate = has(PERM.vacancyPromoImagesCreate);
  const canDelete = has(PERM.vacancyPromoImagesDelete);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [baseImageName, setBaseImageName] = useState<string | null>(null);

  const queryKey = ['vacancy-promo-images', vacancy.id];

  const { data: images = [], isLoading } = useQuery<GeneratedImage[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/vacancy-promo-images?vacancy_id=${vacancy.id}`, { cache: 'no-store' });
      if (!res.ok) return [];
      const items = (await res.json()) as PromoImageItem[];
      return toGeneratedImages(items);
    },
  });

  const generateMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/vacancy-promo-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId: vacancy.id }),
      });
      if (!res.ok) {
        let msg = 'No se pudo generar la imagen.';
        try {
          const body = await res.json();
          if (body?.detail) msg = String(body.detail);
        } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vacancy-promo-images/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let msg = 'No se pudo eliminar la imagen.';
        try {
          const body = await res.json();
          if (body?.detail) msg = String(body.detail);
        } catch { /* ignore parse errors */ }
        throw new Error(msg);
      }
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey }); },
  });

  const handleUpload = (name: string | null, err: string | null) => {
    setUploading(false);
    if (err) {
      setUploadError(`No fue posible subir la imagen: ${err}`);
    } else {
      setBaseImageName(name);
      setUploadError(null);
    }
  };

  const handleGenerate = () => {
    generateMut.mutate();
  };

  const handleDelete = (id: string) => {
    deleteMut.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" /> Cargando imágenes…
      </div>
    );
  }

  const generating = generateMut.isPending;
  const generateError = generateMut.isError
    ? `No fue posible generar la imagen: ${(generateMut.error as Error).message}`
    : null;
  const deleteError = deleteMut.isError
    ? `No fue posible eliminar la imagen: ${(deleteMut.error as Error).message}`
    : null;

  if (images.length === 0 && !generating) {
    return (
      <div className="flex flex-col gap-4">
        {canCreate && (
          <BaseImageUpload
            vacancyId={vacancy.id}
            baseImageName={baseImageName}
            uploading={uploading}
            onUpload={handleUpload}
          />
        )}
        {uploadError && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{uploadError}</p>
        )}
        {generateError && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{generateError}</p>
        )}
        <EmptyState canCreate={canCreate} onGenerate={handleGenerate} loading={generating} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canCreate && (
        <BaseImageUpload
          vacancyId={vacancy.id}
          baseImageName={baseImageName}
          uploading={uploading}
          onUpload={handleUpload}
        />
      )}
      {uploadError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{uploadError}</p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">
            {images.length} imagen{images.length !== 1 ? 'es' : ''} generada{images.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
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
        )}
      </div>

      {generateError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{generateError}</p>
      )}
      {deleteError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{deleteError}</p>
      )}

      <div className="flex flex-wrap gap-5 items-start">
        {generating && <GeneratingSkeleton />}
        {images.map((image) => (
          <ImageCard key={image.id} image={image} canDelete={canDelete} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
