'use client';

import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';

import { Button } from '@/design-system/ui/button';
import { TogglePill } from '@/design-system/molecules/TogglePill';
import { PERM } from '@/features/auth/permissions';
import { usePermissions } from '@/features/auth/PermissionsProvider';
import { resolveDropAction } from '../dropAction';
import { useMovePipelineCard, usePipeline } from '../hooks/usePipeline';
import type { PipelineCard } from '../types';
import { CandidateCardOverlay } from './CandidateCard';
import { PipelineColumn } from './PipelineColumn';
import { RejectReasonDialog } from './RejectReasonDialog';

type MatchFilter = 'all' | 'high' | 'medium';

interface PipelineBoardProps {
  vacancyId: string;
}

interface PendingReject {
  cardId: string;
  toStageId: string;
  fromStageId: string;
  candidateName: string;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex w-60 shrink-0 flex-col gap-2">
          {/* Header skeleton */}
          <div className="h-9 rounded-md bg-surface-2 animate-pulse" />
          {/* Card skeletons */}
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-20 rounded-md bg-surface-2 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PipelineBoard({ vacancyId }: PipelineBoardProps) {
  const { data: pipeline, isLoading, isError, refetch } = usePipeline(vacancyId);
  const { mutate: moveCard, isPending: isMoving } = useMovePipelineCard();
  const { has } = usePermissions();
  const canMove = has(PERM.applicationsUpdate);
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
  const [pendingReject, setPendingReject] = useState<PendingReject | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  if (isLoading) return <BoardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-danger">Error cargando el pipeline</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!pipeline) return null;

  const sortedStages = [...pipeline.stages].sort((a, b) => a.order - b.order);

  function handleDragStart(event: DragStartEvent) {
    const card = pipeline!.cards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    // Defense in depth: cards render non-draggable without applicationsUpdate,
    // so this path shouldn't be reachable — guarded anyway.
    if (!canMove) return;
    const { active, over } = event;
    if (!over) return;

    const fromCard = pipeline!.cards.find((c) => c.id === active.id);
    if (!fromCard) return;

    const toStageId = over.id as string;
    const action = resolveDropAction(pipeline!.stages, fromCard.stageId, toStageId);
    if (action.type === 'noop') return;

    if (action.type === 'reject') {
      // Prompt for a required reason before moving. The card's stageId is left
      // untouched until the user confirms, so it simply renders back in its
      // original column once the drag overlay clears — no explicit "revert" of
      // drag/optimistic state is needed on cancel.
      setRejectError(null);
      setPendingReject({
        cardId: fromCard.id,
        toStageId: action.toStageId,
        fromStageId: fromCard.stageId,
        candidateName: fromCard.candidateName,
      });
      return;
    }

    moveCard({
      cardId: fromCard.id,
      toStageId: action.toStageId,
      fromStageId: fromCard.stageId,
    });
  }

  function handleCancelReject() {
    setPendingReject(null);
    setRejectError(null);
  }

  function handleConfirmReject(reason: string) {
    if (!pendingReject) return;
    setRejectError(null);
    moveCard(
      {
        cardId: pendingReject.cardId,
        toStageId: pendingReject.toStageId,
        fromStageId: pendingReject.fromStageId,
        rejectionReason: reason,
      },
      {
        onSuccess: () => setPendingReject(null),
        onError: (err) =>
          setRejectError(err instanceof Error ? err.message : 'No se pudo rechazar al candidato.'),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-ink-muted">Filtrar por match:</span>
        <TogglePill
          label="Filtrar por match"
          value={matchFilter}
          onValueChange={(v) => setMatchFilter(v as MatchFilter)}
          items={[
            { value: 'all', label: 'Sin filtro' },
            { value: 'high', label: 'Match > 75%' },
            { value: 'medium', label: 'Match > 50%' },
          ]}
        />
      </div>

      {/* Board */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedStages.map((stage) => {
            const stageCards = pipeline.cards.filter((c) => c.stageId === stage.id);
            return (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                cards={stageCards}
                rejectionSummary={
                  stage.type === 'rejected' ? pipeline.rejectionSummary : undefined
                }
                matchFilter={matchFilter}
                canDrag={canMove}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeCard ? <CandidateCardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      <RejectReasonDialog
        open={pendingReject !== null}
        candidateName={pendingReject?.candidateName}
        isSubmitting={isMoving}
        submitError={rejectError}
        onCancel={handleCancelReject}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
