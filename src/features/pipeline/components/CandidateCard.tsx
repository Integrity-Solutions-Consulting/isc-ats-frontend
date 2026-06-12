'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye } from 'lucide-react';

import { cn } from '@/shared/utils';
import { Avatar } from '@/design-system/atoms/Avatar';
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

interface MatchBadgeProps {
  matchPercent: number | null;
  matchStatus: PipelineCard['matchStatus'];
}

function MatchBadge({ matchPercent, matchStatus }: MatchBadgeProps) {
  if (matchStatus === 'analyzing' || matchPercent === null) {
    return (
      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-subtle">
        Analizando
      </span>
    );
  }
  if (matchPercent >= 75) {
    return (
      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        {matchPercent}% match
      </span>
    );
  }
  if (matchPercent >= 50) {
    return (
      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
        {matchPercent}% match
      </span>
    );
  }
  return (
    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
      {matchPercent}% match
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CandidateCardProps {
  card: PipelineCard;
  isDragging?: boolean;
  onView?: () => void;
}

export function CandidateCard({ card, isDragging = false, onView }: CandidateCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'relative cursor-grab select-none rounded-md border border-border bg-surface p-3 shadow-sm transition-all',
        'active:cursor-grabbing',
        isDragging && 'rotate-2 shadow-lg bg-primary-50/80',
      )}
    >
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
        <Avatar size="sm" initials={card.initials} className={cn('text-white', card.avatarColor)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{card.candidateName}</p>
          <MatchBadge matchPercent={card.matchPercent} matchStatus={card.matchStatus} />
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
    </div>
  );
}
