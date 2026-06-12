'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/design-system/ui/button';
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  reactivateTemplate,
} from '../api/profileTemplatesApi';
import { useBreadcrumbStore } from '@/shared/stores/breadcrumbStore';
import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';

type TagBox = 'knowledge' | 'tools' | 'skills' | 'certifications';
const TAG_BOX_LABELS: Record<TagBox, string> = {
  knowledge: 'Conocimientos',
  tools: 'Herramientas',
  skills: 'Habilidades',
  certifications: 'Certificaciones',
};

interface PlantillaDetailPageProps {
  id: string;
}

export function PlantillaDetailPage({ id }: PlantillaDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setPageTitle = useBreadcrumbStore((s) => s.setPageTitle);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ['profile-templates', id],
    queryFn: () => getTemplate(id),
  });

  useEffect(() => {
    if (template) setPageTitle(template.name);
    return () => setPageTitle(null);
  }, [template, setPageTitle]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteTemplate(id),
    onSuccess: () => {
      setTemplateError(null);
      queryClient.removeQueries({ queryKey: ['profile-templates'] });
      router.push(ROUTES.configuracion.plantillas);
    },
    onError: () => {
      setTemplateError('No fue posible eliminar la plantilla. Intentá de nuevo.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateTemplate(id),
    onSuccess: () => {
      setTemplateError(null);
      queryClient.removeQueries({ queryKey: ['profile-templates'] });
    },
    onError: () => {
      setTemplateError('No fue posible reactivar la plantilla. Intentá de nuevo.');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!template) return;
      return createTemplate({ ...template, name: `${template.name} (copia)` });
    },
    onSuccess: (copy) => {
      setTemplateError(null);
      queryClient.removeQueries({ queryKey: ['profile-templates'] });
      if (copy) router.push(ROUTES.configuracion.plantilla(copy.id));
    },
    onError: () => {
      setTemplateError('No fue posible duplicar la plantilla. Intentá de nuevo.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
    );
  }

  if (!template) {
    return <p className="text-sm text-danger">Plantilla no encontrada.</p>;
  }

  const isInactive = template.isActive === false;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Volver">
          <Link href={ROUTES.configuracion.plantillas}><ArrowLeft /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">{template.name}</h1>
            {isInactive && (
              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                Inactivo
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isInactive ? (
            <Button
              size="sm"
              onClick={() => reactivateMutation.mutate()}
              disabled={reactivateMutation.isPending}
            >
              <RefreshCw className="mr-1.5 size-4" />
              Reactivar
            </Button>
          ) : (
            <>
              <Button
                variant="outline" size="sm"
                onClick={() => duplicateMutation.mutate()}
                disabled={duplicateMutation.isPending}
              >
                <Copy className="mr-1.5 size-4" />
                Duplicar
              </Button>
              <Button
                variant="outline" size="sm"
                className="text-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-1.5 size-4" />
                Eliminar
              </Button>
              <Button size="sm" asChild>
                <Link href={`/configuracion/plantillas/${id}/editar`}>
                  <Pencil className="mr-1.5 size-4" />
                  Editar
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {templateError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {templateError}
        </p>
      )}

      {/* Tags grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(TAG_BOX_LABELS) as TagBox[]).map((box) => (
          <div key={box} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-ink">{TAG_BOX_LABELS[box]}</p>
            <div className="flex flex-wrap gap-1.5">
              {(template[box] as string[]).length === 0 ? (
                <span className="text-xs text-ink-subtle">Sin etiquetas</span>
              ) : (template[box] as string[]).map((tag) => (
                <span key={tag} className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
