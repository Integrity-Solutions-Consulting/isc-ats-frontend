'use client';

import { useDroppable } from '@dnd-kit/core';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils';
import { sortCardsByMatch } from '../navigation';
import type { PipelineCard, PipelineStage } from '../types';
import { CandidateCard } from './CandidateCard';

interface PipelineColumnProps {
  stage: PipelineStage;
  /** Already filtered by the board — the column only sorts and renders. */
  cards: PipelineCard[];
  /** Gated by `has(PERM.applicationsUpdate)` at the board level. */
  canDrag?: boolean;
  /** Active board filters, serialized — carried into the profile and back. */
  filterParams?: Record<string, string>;
}

export function PipelineColumn({
  stage,
  cards,
  canDrag = true,
  filterParams,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const router = useRouter();

  // Sort by match percentage, highest first (shared with the profile navigator
  // so a candidate's position is consistent between board and profile).
  const sortedCards = sortCardsByMatch(cards);

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

        {/* Card count pill — always counts the cards actually rendered, so it
            never contradicts the column while filters are active. */}
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-xs font-medium',
            isRejected
              ? 'bg-danger/15 text-danger'
              : isFinal
                ? 'bg-primary-100 text-primary-700'
                : 'bg-border text-ink-muted',
          )}
        >
          {cards.length}
        </span>
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

        {sortedCards.map((card) => (
          <CandidateCard
            key={card.id}
            card={card}
            canDrag={canDrag}
            onView={() => {
              // The stage and the filters travel with the click so the profile
              // can rebuild the exact queue the recruiter is working through —
              // and hand it back untouched when they return to the board.
              router.push(
                ROUTES.candidatoEnVacante(card.vacancyId, card.candidateId, {
                  appId: card.id,
                  stageId: stage.id,
                  filters: filterParams,
                }),
              );
            }}
          />
        ))}

        {sortedCards.length === 0 && !isOver && (
          <div className="flex items-center justify-center rounded-md border border-dashed border-border py-6">
            <p className="text-xs text-ink-subtle">Sin candidatos</p>
          </div>
        )}
      </div>
    </div>
  );
}
