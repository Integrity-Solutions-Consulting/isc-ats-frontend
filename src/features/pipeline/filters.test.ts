import { describe, it, expect } from "vitest";

import {
  EMPTY_FILTERS,
  cityOptionsFrom,
  filterCards,
  hasActiveFilters,
  type PipelineFilters,
} from "./filters";
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
    updatedAt: "2026-08-20T12:00:00.000Z",
    ...overrides,
  };
}

function withFilters(overrides: Partial<PipelineFilters>): PipelineFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe("filterCards — no filters", () => {
  it("returns every card untouched when no filter is set", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b", matchPercent: null, matchStatus: "analyzing" })];
    expect(filterCards(cards, EMPTY_FILTERS)).toEqual(cards);
  });
});

describe("filterCards — minimum match", () => {
  it("keeps candidates whose match is equal to or greater than the threshold", () => {
    const cards = [
      makeCard({ id: "below", matchPercent: 49 }),
      makeCard({ id: "equal", matchPercent: 50 }),
      makeCard({ id: "above", matchPercent: 51 }),
    ];
    const result = filterCards(cards, withFilters({ minMatch: 50 }));
    expect(result.map((c) => c.id)).toEqual(["equal", "above"]);
  });

  it("excludes candidates still being analyzed — an unknown match is not a match", () => {
    const cards = [makeCard({ id: "analyzing", matchPercent: null, matchStatus: "analyzing" })];
    expect(filterCards(cards, withFilters({ minMatch: 0 }))).toEqual([]);
  });

  it("treats a zero threshold as a real filter, not as 'no filter'", () => {
    // 0 is falsy in JS — the guard must test for null, otherwise entering 0
    // would silently show analyzing candidates the recruiter filtered out.
    const cards = [makeCard({ id: "scored", matchPercent: 10 }), makeCard({ id: "analyzing", matchPercent: null, matchStatus: "analyzing" })];
    const result = filterCards(cards, withFilters({ minMatch: 0 }));
    expect(result.map((c) => c.id)).toEqual(["scored"]);
  });
});

describe("filterCards — city", () => {
  it("keeps only candidates from the selected city", () => {
    const cards = [
      makeCard({ id: "gye", city: "Guayaquil" }),
      makeCard({ id: "uio", city: "Quito" }),
    ];
    const result = filterCards(cards, withFilters({ city: "Quito" }));
    expect(result.map((c) => c.id)).toEqual(["uio"]);
  });

  it("excludes candidates with no city on record once a city is selected", () => {
    const cards = [makeCard({ id: "unknown", city: null })];
    expect(filterCards(cards, withFilters({ city: "Quito" }))).toEqual([]);
  });
});

describe("filterCards — currently studying", () => {
  it("keeps only candidates who are studying", () => {
    const cards = [
      makeCard({ id: "studies", isStudying: true }),
      makeCard({ id: "does-not", isStudying: false }),
    ];
    expect(filterCards(cards, withFilters({ studying: "yes" })).map((c) => c.id)).toEqual([
      "studies",
    ]);
  });

  it("keeps only candidates who are not studying", () => {
    const cards = [
      makeCard({ id: "studies", isStudying: true }),
      makeCard({ id: "does-not", isStudying: false }),
    ];
    expect(filterCards(cards, withFilters({ studying: "no" })).map((c) => c.id)).toEqual([
      "does-not",
    ]);
  });
});

describe("filterCards — salary range", () => {
  it("keeps candidates inside an inclusive range", () => {
    const cards = [
      makeCard({ id: "under", salaryExpectation: 799 }),
      makeCard({ id: "low-edge", salaryExpectation: 800 }),
      makeCard({ id: "middle", salaryExpectation: 1000 }),
      makeCard({ id: "high-edge", salaryExpectation: 1200 }),
      makeCard({ id: "over", salaryExpectation: 1201 }),
    ];
    const result = filterCards(cards, withFilters({ minSalary: 800, maxSalary: 1200 }));
    expect(result.map((c) => c.id)).toEqual(["low-edge", "middle", "high-edge"]);
  });

  it("supports an open-ended range with only a minimum", () => {
    const cards = [
      makeCard({ id: "under", salaryExpectation: 500 }),
      makeCard({ id: "over", salaryExpectation: 5000 }),
    ];
    expect(filterCards(cards, withFilters({ minSalary: 1000 })).map((c) => c.id)).toEqual([
      "over",
    ]);
  });

  it("excludes candidates who never declared an expectation", () => {
    // The undeclared case must never be treated as 0 — it would flood every
    // range starting at 0 with candidates whose expectation is unknown.
    const cards = [makeCard({ id: "undeclared", salaryExpectation: null })];
    expect(filterCards(cards, withFilters({ minSalary: 0 }))).toEqual([]);
  });

  it("keeps a declared expectation of 0, which is a real answer", () => {
    const cards = [makeCard({ id: "declared-zero", salaryExpectation: 0 })];
    expect(filterCards(cards, withFilters({ maxSalary: 500 })).map((c) => c.id)).toEqual([
      "declared-zero",
    ]);
  });
});

describe("filterCards — combined", () => {
  it("applies every active filter together", () => {
    const cards = [
      makeCard({ id: "match", city: "Quito", isStudying: true, matchPercent: 90, salaryExpectation: 1000 }),
      makeCard({ id: "wrong-city", city: "Guayaquil", isStudying: true, matchPercent: 90, salaryExpectation: 1000 }),
      makeCard({ id: "not-studying", city: "Quito", isStudying: false, matchPercent: 90, salaryExpectation: 1000 }),
      makeCard({ id: "low-match", city: "Quito", isStudying: true, matchPercent: 40, salaryExpectation: 1000 }),
      makeCard({ id: "pricey", city: "Quito", isStudying: true, matchPercent: 90, salaryExpectation: 9000 }),
    ];
    const result = filterCards(
      cards,
      withFilters({ minMatch: 75, city: "Quito", studying: "yes", minSalary: 500, maxSalary: 2000 }),
    );
    expect(result.map((c) => c.id)).toEqual(["match"]);
  });
});

describe("cityOptionsFrom", () => {
  it("returns unique cities present in the board, alphabetically", () => {
    const cards = [
      makeCard({ id: "1", city: "Quito" }),
      makeCard({ id: "2", city: "Guayaquil" }),
      makeCard({ id: "3", city: "Quito" }),
      makeCard({ id: "4", city: null }),
    ];
    expect(cityOptionsFrom(cards)).toEqual(["Guayaquil", "Quito"]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filter set", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("is true when a zero-valued numeric filter is set", () => {
    expect(hasActiveFilters(withFilters({ minMatch: 0 }))).toBe(true);
    expect(hasActiveFilters(withFilters({ minSalary: 0 }))).toBe(true);
  });
});
