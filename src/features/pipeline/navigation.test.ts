import { describe, it, expect } from "vitest";

import { EMPTY_FILTERS, type PipelineFilters } from "./filters";
import { buildStageNavigation, resolveStageNavigation, sortCardsByMatch } from "./navigation";
import type { PipelineCard } from "./types";

function makeCard(overrides: Partial<PipelineCard> = {}): PipelineCard {
  return {
    id: "app-1",
    candidateId: "cand-1",
    vacancyId: "vac-1",
    stageId: "stage-1",
    candidateName: "Jane Doe",
    initials: "JD",
    avatarColor: "bg-primary-600",
    matchPercent: 80,
    matchStatus: "done",
    stageStatus: "pending_review",
    city: "Guayaquil",
    isStudying: false,
    salaryExpectation: 1200,
    yearsOfExperience: 3,
    updatedAt: "2026-08-20T12:00:00.000Z",
    ...overrides,
  };
}

function withFilters(overrides: Partial<PipelineFilters>): PipelineFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

/** Three candidates in the reviewed stage, already in board order (match desc). */
function reviewQueue(): PipelineCard[] {
  return [
    makeCard({ id: "app-a", candidateId: "cand-a", matchPercent: 90 }),
    makeCard({ id: "app-b", candidateId: "cand-b", matchPercent: 80 }),
    makeCard({ id: "app-c", candidateId: "cand-c", matchPercent: 70 }),
  ];
}

describe("sortCardsByMatch", () => {
  it("orders by match descending and sinks candidates still being analyzed", () => {
    const cards = [
      makeCard({ id: "low", matchPercent: 40 }),
      makeCard({ id: "analyzing", matchPercent: null, matchStatus: "analyzing" }),
      makeCard({ id: "high", matchPercent: 95 }),
    ];
    expect(sortCardsByMatch(cards).map((c) => c.id)).toEqual(["high", "low", "analyzing"]);
  });
});

describe("buildStageNavigation — queue of the reviewed stage", () => {
  it("places the candidate in the stage queue, in board order", () => {
    const nav = buildStageNavigation(reviewQueue(), "stage-1", "cand-b");
    expect(nav.found).toBe(true);
    expect(nav.pos).toBe(2);
    expect(nav.total).toBe(3);
    expect(nav.entries.map((e) => e.candidateId)).toEqual(["cand-a", "cand-b", "cand-c"]);
  });

  it("ignores candidates sitting in other stages", () => {
    const cards = [
      ...reviewQueue(),
      makeCard({ id: "app-x", candidateId: "cand-x", stageId: "stage-2" }),
    ];
    expect(buildStageNavigation(cards, "stage-1", "cand-a").total).toBe(3);
  });

  it("points at the following candidate so the review can continue after a move", () => {
    const nav = buildStageNavigation(reviewQueue(), "stage-1", "cand-b");
    expect(nav.next?.candidateId).toBe("cand-c");
  });

  it("has no next once the last candidate of the queue is reached", () => {
    expect(buildStageNavigation(reviewQueue(), "stage-1", "cand-c").next).toBeNull();
  });

  it("resumes at the head of what is left when the candidate already moved out", () => {
    // Reloading the profile after moving the candidate: they are no longer in
    // the reviewed stage, but the queue behind them still has work to do.
    const cards = [
      makeCard({ id: "app-a", candidateId: "cand-a" }),
      makeCard({ id: "app-moved", candidateId: "cand-moved", stageId: "stage-2" }),
    ];
    const nav = buildStageNavigation(cards, "stage-1", "cand-moved");
    expect(nav.found).toBe(false);
    expect(nav.next?.candidateId).toBe("cand-a");
  });

  it("survives an empty stage without reporting a zero-sized queue", () => {
    const nav = buildStageNavigation([], "stage-1", "cand-a");
    expect(nav).toMatchObject({ found: false, pos: 1, total: 1, next: null });
  });
});

describe("resolveStageNavigation — queue respects the active filters", () => {
  it("walks only the candidates that pass the filters", () => {
    const cards = [
      makeCard({ id: "app-a", candidateId: "cand-a", matchPercent: 90, yearsOfExperience: 5 }),
      makeCard({ id: "app-b", candidateId: "cand-b", matchPercent: 80, yearsOfExperience: 1 }),
      makeCard({ id: "app-c", candidateId: "cand-c", matchPercent: 70, yearsOfExperience: 6 }),
    ];
    const nav = resolveStageNavigation(cards, withFilters({ minExperience: 5 }), "stage-1", "cand-a");
    expect(nav.entries.map((e) => e.candidateId)).toEqual(["cand-a", "cand-c"]);
    expect(nav.total).toBe(2);
    expect(nav.next?.candidateId).toBe("cand-c");
  });

  it("falls back to the full stage when the candidate does not pass the filters", () => {
    // A shared or stale link: the profile must still show a real position
    // instead of collapsing the navigator to "1 de 1".
    const nav = resolveStageNavigation(
      reviewQueue(),
      withFilters({ minMatch: 85 }),
      "stage-1",
      "cand-c",
    );
    expect(nav.found).toBe(true);
    expect(nav.pos).toBe(3);
    expect(nav.total).toBe(3);
  });

  it("matches the unfiltered queue when no filter is active", () => {
    expect(resolveStageNavigation(reviewQueue(), EMPTY_FILTERS, "stage-1", "cand-b")).toEqual(
      buildStageNavigation(reviewQueue(), "stage-1", "cand-b"),
    );
  });
});
