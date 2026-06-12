'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

import { Badge } from '@/design-system/ui/badge';
import { Button } from '@/design-system/ui/button';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '@/features/vacancies/labels';
import type { Vacancy, VacancyFormValues } from '@/features/vacancies/types';
import { deleteVacancy, reactivateVacancy, updateVacancy } from '@/features/vacancies/api/vacanciesApi';
import { vacancyKeys } from '@/features/vacancies/hooks/useVacancies';
import type { VacancyPipelineStats } from '@/features/pipeline/types';
import { ROUTES } from '@/shared/constants/routes';

interface VacancyStripProps {
  vacancy: Vacancy;
  stats: VacancyPipelineStats;
}

function toFormValues(vacancy: Vacancy): VacancyFormValues {
  return {
    position: vacancy.position,
    clientCompany: vacancy.clientCompany,
    contact: vacancy.contact,
    department: vacancy.department,
    city: vacancy.city,
    workMode: vacancy.workMode,
    durationYears: vacancy.durationYears,
    durationMonths: vacancy.durationMonths,
    career: vacancy.career,
    process: vacancy.process,
    level: vacancy.level,
    openings: vacancy.openings,
    experienceYears: vacancy.experienceYears ?? 0,
    workSchedule: vacancy.workSchedule ?? '',
    requirements: vacancy.requirements,
    description: vacancy.description,
  };
}

function StatItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-lg font-semibold text-ink">{value}</span>
    </div>
  );
}

export function VacancyStrip({ vacancy, stats }: VacancyStripProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: ({ newStatus }: { newStatus: Vacancy['status'] }) =>
      updateVacancy(vacancy.id, toFormValues(vacancy), newStatus),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: vacancyKeys.detail(vacancy.id) });
      queryClient.invalidateQueries({ queryKey: vacancyKeys.all });
      router.refresh();
    },
    onError: () => {
      setActionError('No fue posible actualizar el estado de la vacante. Intentá de nuevo.');
    },
  });

  const { mutate: eliminar, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteVacancy(vacancy.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vacancyKeys.all });
      router.push(ROUTES.vacantes);
    },
    onError: () => {
      setActionError('No fue posible eliminar la vacante. Intentá de nuevo.');
    },
  });

  const { mutate: reactivar, isPending: isReactivating } = useMutation({
    mutationFn: () => reactivateVacancy(vacancy.id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: vacancyKeys.all });
      queryClient.invalidateQueries({ queryKey: vacancyKeys.detail(vacancy.id) });
      router.refresh();
    },
    onError: () => {
      setActionError('No fue posible reactivar la vacante. Intentá de nuevo.');
    },
  });

  const isClosed = vacancy.status === 'closed';

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Volver">
          <Link href={ROUTES.vacantes}><ArrowLeft /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink">{vacancy.position}</h1>
            {vacancy.isActive === false ? (
              <Badge variant="neutral">Inactivo</Badge>
            ) : (
              <Badge variant={STATUS_BADGE_VARIANT[vacancy.status]}>
                {STATUS_LABEL[vacancy.status]}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vacancy.isActive === false ? (
            <Button size="sm" disabled={isReactivating} onClick={() => reactivar()}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Reactivar
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => router.replace(`${pathname}?tab=imagenes`)}
              >
                <Sparkles size={14} />
                Generar imagen
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.vacanteEditar(vacancy.id))}>
                Editar
              </Button>

              {!isClosed && (
                <Button variant="destructive" size="sm" disabled={isPending} onClick={() => changeStatus({ newStatus: 'closed' })}>
                  Cerrar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-danger hover:bg-danger/10 hover:text-danger"
                disabled={isDeleting || isPending}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
        <StatItem
          label="Postulantes"
          value={
            <span className="flex items-center gap-1">
              {stats.totalApplicants}
              {stats.newApplicants > 0 && (
                <Badge variant="default" className="text-xs">+{stats.newApplicants}</Badge>
              )}
            </span>
          }
        />
        <StatItem label="Cubiertas" value={`${stats.filledCount}/${stats.openings}`} />
        <StatItem label="Rechazados" value={stats.rejectedCount} />
        <StatItem label="Match >75%" value={<span className="text-success">{stats.highMatchCount}</span>} />
      </div>

      {actionError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {actionError}
        </p>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Eliminar vacante?"
        description="Esta acción desactivará la vacante de forma permanente. No se podrá revertir."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => eliminar()}
      />
    </div>
  );
}
