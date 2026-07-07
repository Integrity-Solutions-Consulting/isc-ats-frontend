import type { PipelineCard } from './types';

export interface PipelineNavEntry {
  candidateId: string;
  appId: string;
  vacancyId: string;
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

// Position navigator for a candidate within their CURRENT stage, derived from
// the live pipeline so "candidato X de N" reflects where the candidate is now —
// not the stage they were in when the profile was first opened. Recomputed on
// every router.refresh() (e.g. after moving the candidate to another stage).
export function buildStageNavigation(
  cards: PipelineCard[],
  stageId: string,
  candidateId: string,
): { entries: PipelineNavEntry[]; pos: number; total: number } {
  const stageCards = sortCardsByMatch(cards.filter((c) => c.stageId === stageId));
  const entries = stageCards.map((c) => ({
    candidateId: c.candidateId,
    appId: c.id,
    vacancyId: c.vacancyId,
  }));
  const index = stageCards.findIndex((c) => c.candidateId === candidateId);
  return {
    entries,
    pos: index >= 0 ? index + 1 : 1,
    total: stageCards.length || 1,
  };
}
