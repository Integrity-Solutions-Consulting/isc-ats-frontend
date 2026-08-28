import { filterCards, type PipelineFilters } from './filters';
import type { PipelineCard } from './types';

export interface PipelineNavEntry {
  candidateId: string;
  appId: string;
  vacancyId: string;
}

export interface StageNavigation {
  /** The reviewing queue, in board order. */
  entries: PipelineNavEntry[];
  /** Whether the candidate is still part of that queue. */
  found: boolean;
  pos: number;
  total: number;
  /** Where to land once the candidate leaves the queue; null when it is done. */
  next: PipelineNavEntry | null;
}

// Match score used to order a stage column: highest match first; cards still
// analyzing or without a computed score sink to the bottom.
function matchScore(card: PipelineCard): number | null {
  return card.matchStatus === 'analyzing' ? null : card.matchPercent;
}

// The same ordering the kanban column uses, so a candidate's position stays
// consistent between the board and the profile navigator.
export function sortCardsByMatch(cards: PipelineCard[]): PipelineCard[] {
  return [...cards].sort((a, b) => {
    const aScore = matchScore(a);
    const bScore = matchScore(b);
    if (aScore === null && bScore === null) return 0;
    if (aScore === null) return 1;
    if (bScore === null) return -1;
    return bScore - aScore;
  });
}

/**
 * Position navigator for a candidate within the stage being REVIEWED — the
 * stage the recruiter opened the profile from, not wherever the candidate has
 * been moved to since.
 *
 * Anchoring it to the reviewed stage is what makes the review loop work: move a
 * candidate forward and the queue of everyone still waiting in that stage stays
 * intact, so the recruiter keeps advancing them one by one without going back
 * to the board. The candidate's actual stage is never hidden — the status
 * sidebar states it explicitly.
 */
export function buildStageNavigation(
  cards: PipelineCard[],
  stageId: string,
  candidateId: string,
): StageNavigation {
  const stageCards = sortCardsByMatch(cards.filter((c) => c.stageId === stageId));
  const entries = stageCards.map((c) => ({
    candidateId: c.candidateId,
    appId: c.id,
    vacancyId: c.vacancyId,
  }));
  const index = stageCards.findIndex((c) => c.candidateId === candidateId);
  const found = index >= 0;
  return {
    entries,
    found,
    pos: found ? index + 1 : 1,
    total: stageCards.length || 1,
    // Already gone from the queue (moved, then the page was reloaded): the head
    // of what is left is the natural place to resume.
    next: found ? (entries[index + 1] ?? null) : (entries[0] ?? null),
  };
}

/**
 * Builds the navigator over the cards the recruiter is actually looking at —
 * the filtered board — so prev/next never jumps to someone the active filters
 * had ruled out.
 *
 * If the candidate does not survive those filters (a stale link, or data that
 * changed under an active filter), the full stage is used instead: an
 * inaccurate position is still better than a queue the candidate is not in.
 */
export function resolveStageNavigation(
  cards: PipelineCard[],
  filters: PipelineFilters,
  stageId: string,
  candidateId: string,
): StageNavigation {
  const filtered = buildStageNavigation(filterCards(cards, filters), stageId, candidateId);
  if (filtered.found) return filtered;
  return buildStageNavigation(cards, stageId, candidateId);
}
