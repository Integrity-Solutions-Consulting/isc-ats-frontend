'use client';

import { useDraggable } from '@dnd-kit/core';
import { formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye } from 'lucide-react';

import { cn } from '@/shared/utils';
import { Avatar } from '@/design-system/atoms/Avatar';
import { MatchBadge } from '@/design-system/molecules/MatchBadge';
import type { CandidateStageStatus, PipelineCard } from '../types';


// ─── Stage status labels ──────────────────────────────────────────────────────

export const STAGE_STATUS_LABEL: Record<CandidateStageStatus, string> = {
  pending_review: 'Por revisar',
  in_process: 'En proceso',
  rescheduled: 'Reagendado',
  confirmed: 'Confirmada',
  test_sent: 'Prueba enviada',
  under_review: 'En revisión',
  interview_scheduled: 'Entrevista agendada',
  awaiting_client: 'Espera resp. cliente',
  offer_sent: 'Oferta enviada',
  negotiating: 'Negociando oferta',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSalary(amount: number): string {
  return '$ ' + amount.toLocaleString('es-EC');
}

function formatDate(isoDate: string): string {
  const date = parseISO(isoDate);
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

// ─── Card visuals ─────────────────────────────────────────────────────────────

const CARD_CLASS =
  'relative cursor-grab select-none rounded-md border border-border bg-surface p-3 shadow-sm transition-colors active:cursor-grabbing';

/** Presentational card body — no drag wiring. Shared by the draggable source and the overlay. */
function CardBody({ card, onView }: { card: PipelineCard; onView?: () => void }) {
  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.();
  };

  return (
    <>
      {/* Eye button — stops drag propagation, navigates to candidate profile */}
      <button
        type="button"
        aria-label="Ver perfil del candidato"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleViewClick}
        className="absolute right-2 top-2 grid size-6 place-items-center rounded text-ink-subtle opacity-0 transition-opacity hover:bg-surface-2 hover:text-primary-600 group-hover:opacity-100 [.cursor-grab_&]:opacity-100"
      >
        <Eye className="size-3.5" />
      </button>

      {/* Header: avatar + name + match */}
      <div className="flex items-start gap-2.5 pr-6">
        <Avatar
          size="sm"
          initials={card.initials}
          src={card.avatarFileId ? `/api/candidate/cv/${card.avatarFileId}?view=1` : undefined}
          className={cn('text-white', card.avatarColor)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{card.candidateName}</p>
          <MatchBadge score={card.matchStatus === 'analyzing' ? null : card.matchPercent} />
        </div>
      </div>

      {/* Stage status */}
      <p className="mt-2 text-xs text-ink-muted">
        {STAGE_STATUS_LABEL[card.stageStatus]}
      </p>

      {/* Footer: salary + date */}
      <div className="mt-2 flex items-center justify-between text-xs text-ink-subtle">
        <span>{formatSalary(card.salaryExpectation)}</span>
        <span>{formatDate(card.updatedAt)}</span>
      </div>
    </>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

interface CandidateCardProps {
  card: PipelineCard;
  onView?: () => void;
}

/**
 * Draggable source card. The DragOverlay owns the moving visual, so this node
 * never applies a transform — it stays put and dims into a ghost while dragging.
 * Applying a transform here too would render a second moving copy (visible once
 * the board auto-scrolls horizontally).
 */
export function CandidateCard({ card, onView }: CandidateCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(CARD_CLASS, isDragging && 'opacity-40')}
    >
      <CardBody card={card} onView={onView} />
    </div>
  );
}

/** Presentational clone rendered inside DragOverlay — follows the cursor, no drag hooks. */
export function CandidateCardOverlay({ card }: { card: PipelineCard }) {
  return (
    <div className={CARD_CLASS}>
      <CardBody card={card} />
    </div>
  );
}
