'use client';

import { Download, Trash2 } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { useVacancyDocuments } from '@/features/pipeline/hooks/usePipeline';
import { cn } from '@/shared/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentosTabProps {
  vacancyId: string;
}

function formatDateTime(isoDatetime: string): string {
  try {
    return format(parseISO(isoDatetime), "d MMM yyyy, HH:mm", { locale: es });
  } catch {
    return isoDatetime;
  }
}

export function DocumentosTab({ vacancyId }: DocumentosTabProps) {
  const { data: docs = [], isLoading, isError } = useVacancyDocuments(vacancyId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
        <p className="text-sm text-danger">Error cargando los documentos.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">
          {docs.length} documento{docs.length !== 1 ? 's' : ''} generado{docs.length !== 1 ? 's' : ''} en esta vacante
        </h3>
      </div>

      {docs.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-ink-subtle">No hay documentos generados aún.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-3 text-left font-semibold text-ink-muted">Candidato</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-muted">Etapa al generar</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-muted">Archivo</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-muted">Versión</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-muted">Generado por</th>
                <th className="px-4 py-3 text-left font-semibold text-ink-muted">Fecha</th>
                <th className="px-4 py-3 text-right font-semibold text-ink-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-border last:border-0 hover:bg-primary-50/40"
                >
                  {/* Candidato */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                          doc.candidateAvatarColor,
                        )}
                      >
                        {doc.candidateInitials}
                      </div>
                      <span className="font-medium text-ink">{doc.candidateName}</span>
                    </div>
                  </td>

                  {/* Etapa */}
                  <td className="px-4 py-3 text-ink-muted">{doc.stageNameAtGeneration}</td>

                  {/* Archivo */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-ink">{doc.fileName}</span>
                  </td>

                  {/* Versión */}
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-muted">
                      v{doc.version}
                    </span>
                  </td>

                  {/* Generado por */}
                  <td className="px-4 py-3 text-ink-muted">{doc.generatedBy}</td>

                  {/* Fecha */}
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">
                    {formatDateTime(doc.generatedAt)}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Descargar documento"
                        className="h-7 w-7"
                        disabled
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar documento"
                        className="h-7 w-7 text-danger hover:bg-danger/10"
                        disabled
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
