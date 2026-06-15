'use client';

import { useDroppable } from '@dnd-kit/core';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@/shared/utils';
import { usePipelineNavStore } from '@/shared/stores/pipelineNavStore';
import type { PipelineCard, PipelineStage, RejectionSummary } from '../types';
import { CandidateCard } from './CandidateCard';

interface PipelineColumnProps {
  stage: PipelineStage;
  cards: PipelineCard[];
  rejectionSummary?: RejectionSummary;
  matchFilter: 'all' | 'high' | 'medium';
}

export function PipelineColumn({
  stage,
  cards,
  rejectionSummary,
  matchFilter,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const router = useRouter();
  const setNavEntries = usePipelineNavStore((s) => s.setEntries);

  // Filter cards based on match percentage
  const filteredCards = cards.filter((card) => {
    if (matchFilter === 'all') return true;
    if (card.matchStatus === 'analyzing' || card.matchPercent === null) return false;
    if (matchFilter === 'high') return card.matchPercent >= 75;
    if (matchFilter === 'medium') return card.matchPercent >= 50;
    return true;
  });

  const isRejected = stage.type === 'rejected';
  const isFinal = stage.type === 'final';

  return (
    <div className="flex w-60 shrink-0 flex-col gap-2">
      {/* Column header */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-border px-3 py-2',
          isFinal && 'bg-primary-50',
          !isFinal && !isRejected && 'bg-surface-2',
          isRejected && 'bg-danger/5',
          isOver && !isRejected && 'border-primary-400',
          isOver && isRejected && 'border-danger',
        )}
      >
        {/* Order badge */}
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            isRejected
              ? 'bg-danger/15 text-danger'
              : isFinal
                ? 'bg-primary-600 text-white'
                : 'bg-primary-100 text-primary-700',
          )}
        >
          {stage.order}
        </span>

        <span className="flex-1 truncate text-sm font-semibold text-ink">{stage.name}</span>

        {isFinal && <Star className="h-3.5 w-3.5 shrink-0 text-primary-500" />}

        {/* Card count pill */}
        {!isRejected && (
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-xs font-medium',
              isFinal
                ? 'bg-primary-100 text-primary-700'
                : 'bg-border text-ink-muted',
            )}
          >
            {filteredCards.length}
          </span>
        )}
        {isRejected && rejectionSummary && (
          <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-xs font-medium text-danger">
            {rejectionSummary.total}
          </span>
        )}
      </div>

      {/* Drop area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[160px] flex-col gap-2 rounded-md p-1 transition-colors',
          isOver && !isRejected && 'bg-primary-50/50',
          isOver && isRejected && 'bg-danger/5',
        )}
      >
        {/* Drop indicator line when hovering */}
        {isOver && (
          <div
            className={`h-0.5 w-full rounded-full border border-dashed ${isRejected ? 'border-danger bg-danger/40' : 'border-primary-400 bg-primary-200'}`}
          />
        )}

        {filteredCards.map((card, idx) => (
          <CandidateCard
            key={card.id}
            card={card}
            onView={() => {
              setNavEntries(
                filteredCards.map((c) => ({
                  candidateId: c.candidateId,
                  appId: c.id,
                  vacancyId: c.vacancyId,
                })),
              );
              router.push(
                `/vacantes/${card.vacancyId}/candidato/${card.candidateId}?appId=${card.id}&pos=${idx + 1}&total=${filteredCards.length}`,
              );
            }}
          />
        ))}

        {filteredCards.length === 0 && !isOver && (
          <div className="flex items-center justify-center rounded-md border border-dashed border-border py-6">
            <p className="text-xs text-ink-subtle">Sin candidatos</p>
          </div>
        )}
      </div>
    </div>
  );
}
