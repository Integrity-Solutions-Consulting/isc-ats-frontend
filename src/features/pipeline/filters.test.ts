import { describe, it, expect } from "vitest";

import {
  EMPTY_FILTERS,
  cityOptionsFrom,
  filterCards,
  filtersToParams,
  hasActiveFilters,
  parseFilters,
  universityOptionsFrom,
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
    university: "ESPOL",
    isStudying: false,
    salaryExpectation: 1200,
    yearsOfExperience: 3,
    updatedAt: "2026-08-20T12:00:00.000Z",
    ...overrides,
  };
}

/**
 * Builds an ISO timestamp for a local calendar day and hour.
 *
 * The date filter buckets cards by the recruiter's local day, so tests must not
 * hardcode UTC strings — those would pass or fail depending on the machine's
 * timezone. `new Date(y, m, d, h)` is local by construction.
 */
function localIso(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour).toISOString();
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

describe("filterCards — minimum experience", () => {
  it("keeps every card when the filter is inactive", () => {
    const cards = [
      makeCard({ id: "declared", yearsOfExperience: 1 }),
      makeCard({ id: "undeclared", yearsOfExperience: null }),
    ];
    expect(filterCards(cards, EMPTY_FILTERS)).toEqual(cards);
  });

  it("keeps candidates whose experience is equal to or greater than the minimum", () => {
    const cards = [
      makeCard({ id: "below", yearsOfExperience: 1.5 }),
      makeCard({ id: "equal", yearsOfExperience: 2 }),
      makeCard({ id: "above", yearsOfExperience: 2.5 }),
    ];
    const result = filterCards(cards, withFilters({ minExperience: 2 }));
    expect(result.map((c) => c.id)).toEqual(["equal", "above"]);
  });

  it("excludes candidates who never declared their experience", () => {
    // Undeclared is unknown, not zero — it cannot be claimed to meet any
    // minimum the recruiter asked for.
    const cards = [makeCard({ id: "undeclared", yearsOfExperience: null })];
    expect(filterCards(cards, withFilters({ minExperience: 0 }))).toEqual([]);
  });

  it("keeps a declared experience of 0 when the minimum is 0, but excludes it once the minimum is raised", () => {
    const cards = [makeCard({ id: "declared-zero", yearsOfExperience: 0 })];
    expect(filterCards(cards, withFilters({ minExperience: 0 })).map((c) => c.id)).toEqual([
      "declared-zero",
    ]);
    expect(filterCards(cards, withFilters({ minExperience: 1 }))).toEqual([]);
  });
});

describe("filterCards — name search", () => {
  it("matches on any part of the name, not just the start", () => {
    const cards = [
      makeCard({ id: "a", candidateName: "María Fernanda Loor" }),
      makeCard({ id: "b", candidateName: "Pedro Andrade" }),
    ];
    expect(filterCards(cards, withFilters({ name: "loor" })).map((c) => c.id)).toEqual(["a"]);
  });

  it("ignores accents, so 'perez' finds 'Pérez'", () => {
    // Ecuadorian names carry tildes and ñ constantly, but nobody types them
    // into a search box. Requiring the exact accent would make the field feel
    // broken for the most common surnames on the board.
    const cards = [
      makeCard({ id: "accented", candidateName: "Juan Pérez Muñoz" }),
      makeCard({ id: "other", candidateName: "Ana Salas" }),
    ];
    expect(filterCards(cards, withFilters({ name: "perez munoz" })).map((c) => c.id)).toEqual([
      "accented",
    ]);
  });

  it("matches each word independently, so first and last name need not be adjacent", () => {
    // "Juan Muñoz" must find "Juan Carlos Pérez Muñoz". A plain substring test
    // fails here, and two-given-names/two-surnames is the norm in Ecuador.
    const cards = [makeCard({ id: "a", candidateName: "Juan Carlos Pérez Muñoz" })];
    expect(filterCards(cards, withFilters({ name: "juan munoz" })).map((c) => c.id)).toEqual(["a"]);
  });

  it("requires every word to match, not just one of them", () => {
    const cards = [
      makeCard({ id: "both", candidateName: "Juan Pérez" }),
      makeCard({ id: "one", candidateName: "Juan Salas" }),
    ];
    expect(filterCards(cards, withFilters({ name: "juan perez" })).map((c) => c.id)).toEqual([
      "both",
    ]);
  });

  it("treats a blank or whitespace-only query as no filter at all", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b", candidateName: "Otro" })];
    expect(filterCards(cards, withFilters({ name: "   " }))).toEqual(cards);
  });
});

describe("filterCards — university", () => {
  it("keeps only candidates from the selected university", () => {
    const cards = [
      makeCard({ id: "espol", university: "ESPOL" }),
      makeCard({ id: "ucuenca", university: "Universidad de Cuenca" }),
    ];
    const result = filterCards(cards, withFilters({ university: "Universidad de Cuenca" }));
    expect(result.map((c) => c.id)).toEqual(["ucuenca"]);
  });

  it("excludes candidates with no university on record once one is selected", () => {
    const cards = [makeCard({ id: "unknown", university: null })];
    expect(filterCards(cards, withFilters({ university: "ESPOL" }))).toEqual([]);
  });
});

describe("filterCards — last-activity date range", () => {
  it("keeps cards inside an inclusive range", () => {
    const cards = [
      makeCard({ id: "before", updatedAt: localIso(2026, 9, 4) }),
      makeCard({ id: "low-edge", updatedAt: localIso(2026, 9, 5) }),
      makeCard({ id: "middle", updatedAt: localIso(2026, 9, 6) }),
      makeCard({ id: "high-edge", updatedAt: localIso(2026, 9, 7) }),
      makeCard({ id: "after", updatedAt: localIso(2026, 9, 8) }),
    ];
    const result = filterCards(
      cards,
      withFilters({ updatedFrom: "2026-09-05", updatedTo: "2026-09-07" }),
    );
    expect(result.map((c) => c.id)).toEqual(["low-edge", "middle", "high-edge"]);
  });

  it("supports a single day by setting both bounds to it", () => {
    const cards = [
      makeCard({ id: "that-day", updatedAt: localIso(2026, 9, 6) }),
      makeCard({ id: "next-day", updatedAt: localIso(2026, 9, 7) }),
    ];
    const result = filterCards(
      cards,
      withFilters({ updatedFrom: "2026-09-06", updatedTo: "2026-09-06" }),
    );
    expect(result.map((c) => c.id)).toEqual(["that-day"]);
  });

  it("supports an open-ended range with only a lower bound", () => {
    const cards = [
      makeCard({ id: "old", updatedAt: localIso(2026, 9, 1) }),
      makeCard({ id: "recent", updatedAt: localIso(2026, 9, 9) }),
    ];
    expect(filterCards(cards, withFilters({ updatedFrom: "2026-09-05" })).map((c) => c.id)).toEqual(
      ["recent"],
    );
  });

  it("buckets by the recruiter's local day, not by the UTC day", () => {
    // Ecuador is UTC-5, so anything touched after 19:00 local carries the NEXT
    // UTC date. Slicing the ISO string instead of reading the local calendar day
    // would file last night's activity under tomorrow, and the candidate would
    // vanish from the recruiter's "yesterday" review.
    const lateEvening = localIso(2026, 9, 6, 22);
    const cards = [makeCard({ id: "late", updatedAt: lateEvening })];
    const result = filterCards(
      cards,
      withFilters({ updatedFrom: "2026-09-06", updatedTo: "2026-09-06" }),
    );
    expect(result.map((c) => c.id)).toEqual(["late"]);
  });

  it("keeps every card when neither bound is set", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b" })];
    expect(filterCards(cards, EMPTY_FILTERS)).toEqual(cards);
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

describe("universityOptionsFrom", () => {
  it("returns unique universities present in the board, alphabetically", () => {
    const cards = [
      makeCard({ id: "1", university: "ESPOL" }),
      makeCard({ id: "2", university: "Universidad de Cuenca" }),
      makeCard({ id: "3", university: "ESPOL" }),
      makeCard({ id: "4", university: null }),
    ];
    expect(universityOptionsFrom(cards)).toEqual(["ESPOL", "Universidad de Cuenca"]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filter set", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("is true when a zero-valued numeric filter is set", () => {
    expect(hasActiveFilters(withFilters({ minMatch: 0 }))).toBe(true);
    expect(hasActiveFilters(withFilters({ minSalary: 0 }))).toBe(true);
    expect(hasActiveFilters(withFilters({ minExperience: 0 }))).toBe(true);
  });

  it("is true for each of the text and date filters", () => {
    expect(hasActiveFilters(withFilters({ name: "perez" }))).toBe(true);
    expect(hasActiveFilters(withFilters({ university: "ESPOL" }))).toBe(true);
    expect(hasActiveFilters(withFilters({ updatedFrom: "2026-09-06" }))).toBe(true);
    expect(hasActiveFilters(withFilters({ updatedTo: "2026-09-06" }))).toBe(true);
  });
});

describe("filters URL round-trip", () => {
  it("writes nothing for an untouched board", () => {
    expect(filtersToParams(EMPTY_FILTERS)).toEqual({});
  });

  it("restores every filter it wrote", () => {
    const filters = withFilters({
      name: "pérez muñoz",
      minMatch: 75,
      city: "Quito",
      university: "Universidad de Cuenca",
      studying: "yes",
      minSalary: 800,
      maxSalary: 1200,
      minExperience: 2.5,
      updatedFrom: "2026-09-05",
      updatedTo: "2026-09-07",
    });
    expect(parseFilters(filtersToParams(filters))).toEqual(filters);
  });

  it("ignores a malformed date in the URL rather than filtering by garbage", () => {
    // A hand-edited or truncated link must not silently empty the board.
    expect(parseFilters({ updatedFrom: "ayer", updatedTo: "2026-9-5" })).toEqual(EMPTY_FILTERS);
  });

  it("round-trips zero-valued filters instead of dropping them as falsy", () => {
    // 0 is a threshold the recruiter deliberately typed. Serializing it away
    // would silently widen the board after leaving and coming back.
    const filters = withFilters({ minMatch: 0, minSalary: 0, minExperience: 0 });
    expect(parseFilters(filtersToParams(filters))).toEqual(filters);
  });

  it("falls back to the empty set for a URL with no filter params", () => {
    expect(parseFilters({})).toEqual(EMPTY_FILTERS);
  });

  it("ignores unparseable or unknown values rather than filtering by garbage", () => {
    expect(parseFilters({ minMatch: "abc", studying: "maybe", minSalary: "" })).toEqual(
      EMPTY_FILTERS,
    );
  });
});
