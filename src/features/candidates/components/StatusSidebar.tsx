'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileDown, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/design-system/ui/badge';
import { Button } from '@/design-system/ui/button';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';
import type { CandidateStageStatus, PipelineStage } from '@/features/pipeline/types';
import {
  useAddToTalentPool,
  useMoveToNextStage,
  useRejectCandidate,
  useUpdateStageStatus,
} from '@/features/candidates/hooks/useCandidates';
import type { CandidateApplication, OtherApplication } from '@/features/candidates/types';
import { AgendarEntrevistaModal } from '@/features/interviews/components/AgendarEntrevistaModal';

interface StatusSidebarProps {
  application: CandidateApplication;
  stages: PipelineStage[];
  otherApplications: OtherApplication[];
  vacancyId: string;
  candidateName: string;
  candidateInitials: string;
  candidateAvatarColor: string;
  position: string;
}

export function StatusSidebar({
  application,
  stages,
  otherApplications,
  vacancyId,
  candidateName,
  candidateInitials,
  candidateAvatarColor,
  position,
}: StatusSidebarProps) {
  const router = useRouter();

  const { data: stageStatuses = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['org', 'catalog', 'stage_status'],
    queryFn: async () => {
      const res = await fetch('/api/org/parameters?type=stage_status');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateStatusMutation = useUpdateStageStatus();
  const moveToNextMutation = useMoveToNextStage();
  const rejectMutation = useRejectCandidate();
  const talentPoolMutation = useAddToTalentPool();
  const [talentPoolAdded, setTalentPoolAdded] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);

  async function handleGenerateWord() {
    if (generatingWord) return;
    setGeneratingWord(true);
    try {
      const res = await fetch(`/api/recruitment/applications/${application.id}/generate-profile`);
      if (!res.ok) throw new Error('Error al generar el documento');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perfil_${candidateName.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingWord(false);
    }
  }
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  const currentStage = stages.find((s) => s.id === application.stageId);
  const normalStages = stages
    .filter((s) => s.type === 'normal' || s.type === 'final')
    .sort((a, b) => a.order - b.order);

  const currentStageIndex = normalStages.findIndex((s) => s.id === application.stageId);
  const nextStage = currentStageIndex >= 0 ? normalStages[currentStageIndex + 1] : undefined;

  const isOnFinalOrRejected =
    currentStage?.type === 'final' ||
    currentStage?.type === 'rejected' ||
    application.stageId === 'stage-rejected';

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const statusId = Number(e.target.value);
    if (!statusId) return;
    updateStatusMutation.mutate(
      { applicationId: application.id, statusId },
      { onSuccess: () => router.refresh() },
    );
  };

  const handleMoveNext = () => {
    if (!nextStage) return;
    moveToNextMutation.mutate(
      { applicationId: application.id, toStageId: nextStage.id, vacancyId },
      { onSuccess: () => router.refresh() },
    );
  };

  const handleReject = () => {
    setConfirmRejectOpen(true);
  };

  const handleAddToTalentPool = () => {
    talentPoolMutation.mutate(
      { candidateId: application.candidateId, vacancyId },
      { onSuccess: () => setTalentPoolAdded(true) },
    );
  };

  const isLoading =
    updateStatusMutation.isPending ||
    moveToNextMutation.isPending ||
    rejectMutation.isPending;

  return (
    <>
    <div className="flex flex-col gap-4">
      {/* Current status card */}
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
          Estado actual
        </p>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-ink-subtle mb-1">Etapa</p>
            <p className="text-sm font-medium text-ink">
              {currentStage?.name ?? '—'}
            </p>
          </div>

          <div>
            <label htmlFor="sub-estado-select" className="text-xs text-ink-subtle mb-1 block">Sub-estado</label>
            <select
              id="sub-estado-select"
              value={application.currentStatusId ?? ""}
              onChange={handleStatusChange}
              disabled={isLoading || stageStatuses.length === 0}
              className="w-full rounded-md border border-border bg-bg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50"
            >
              <option value="">— Sin sub-estado —</option>
              {stageStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions card */}
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
          Acciones
        </p>

        <div className="space-y-2">
          {/* Move to next stage */}
          <div>
            <Button
              className="w-full"
              onClick={handleMoveNext}
              disabled={isOnFinalOrRejected || !nextStage || isLoading}
            >
              {moveToNextMutation.isPending ? 'Moviendo…' : 'Mover a siguiente etapa'}
            </Button>
            {nextStage && !isOnFinalOrRejected && (
              <p className="mt-1 text-center text-xs text-ink-subtle">
                → {nextStage.name}
              </p>
            )}
          </div>

          {/* Schedule interview */}
          <Button variant="outline" className="w-full" onClick={() => setShowScheduleModal(true)}>
            Agendar entrevista
          </Button>

          {/* Generate Word */}
          <Button
            variant="outline"
            className="w-full"
            disabled={generatingWord}
            onClick={handleGenerateWord}
          >
            {generatingWord
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando…</>
              : <><FileDown className="h-4 w-4 mr-2" />Generar Word</>
            }
          </Button>

          {/* Talent bank */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddToTalentPool}
            disabled={talentPoolAdded || talentPoolMutation.isPending}
          >
            {talentPoolAdded
              ? 'Añadido al banco de talento'
              : talentPoolMutation.isPending
                ? 'Añadiendo…'
                : 'Añadir al banco de talento'}
          </Button>
          {talentPoolMutation.isError && !talentPoolAdded && (
            <p className="text-center text-xs text-danger">
              {talentPoolMutation.error.message}
            </p>
          )}

          {/* Reject */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleReject}
            disabled={isLoading || application.stageId === 'stage-rejected'}
          >
            {rejectMutation.isPending ? 'Rechazando…' : 'Rechazar candidato'}
          </Button>
        </div>
      </div>

      {/* Other applications card */}
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
          Otras postulaciones
        </p>

        {otherApplications.length === 0 ? (
          <p className="text-sm text-ink-subtle">Sin otras postulaciones</p>
        ) : (
          <ul className="space-y-3">
            {otherApplications.map((app) => (
              <li key={app.applicationId} className="rounded-md bg-warning/10 p-3">
                <p className="text-sm font-medium text-ink">{app.vacancyTitle}</p>
                <p className="text-xs text-ink-muted mb-1.5">{app.companyName}</p>
                <Badge variant="warning">{app.statusLabel}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

    {showScheduleModal && (
      <AgendarEntrevistaModal
        candidateName={candidateName}
        candidateInitials={candidateInitials}
        avatarColor={candidateAvatarColor}
        position={position}
        onClose={() => setShowScheduleModal(false)}
      />
    )}

    <ConfirmDialog
      open={confirmRejectOpen}
      onOpenChange={setConfirmRejectOpen}
      title="¿Rechazar candidato?"
      description="El candidato será movido a la columna de rechazados. Esta acción puede deshacerse cambiando el estado manualmente."
      confirmLabel="Rechazar"
      variant="danger"
      onConfirm={() =>
        rejectMutation.mutate(
          { applicationId: application.id, vacancyId },
          { onSuccess: () => { setConfirmRejectOpen(false); router.refresh(); } },
        )
      }
    />
    </>
  );
}
