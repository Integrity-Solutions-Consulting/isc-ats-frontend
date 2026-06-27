'use client';

import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';

import { Button } from '@/design-system/ui/button';
import { TogglePill } from '@/design-system/molecules/TogglePill';
import { useMovePipelineCard, usePipeline } from '../hooks/usePipeline';
import type { PipelineCard } from '../types';
import { CandidateCardOverlay } from './CandidateCard';
import { PipelineColumn } from './PipelineColumn';

type MatchFilter = 'all' | 'high' | 'medium';

interface PipelineBoardProps {
  vacancyId: string;
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
  const { mutate: moveCard } = useMovePipelineCard();
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');

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
    const { active, over } = event;
    if (!over) return;

    const fromCard = pipeline!.cards.find((c) => c.id === active.id);
    if (!fromCard) return;

    const toStageId = over.id as string;
    if (fromCard.stageId === toStageId) return;

    // Check that the drop target is a valid stage
    const isValidStage = pipeline!.stages.some((s) => s.id === toStageId);
    if (!isValidStage) return;

    moveCard({
      cardId: fromCard.id,
      toStageId,
      fromStageId: fromCard.stageId,
    });
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
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeCard ? <CandidateCardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
