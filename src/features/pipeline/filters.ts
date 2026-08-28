import type { PipelineCard } from './types';

/**
 * Candidate filters applied to the Kanban board.
 *
 * Filtering is client-side on purpose: the pipeline endpoint already returns
 * every card for the vacancy in one payload, so narrowing it here costs nothing
 * and keeps the board instant while the recruiter tweaks the criteria.
 *
 * `null` on a numeric field means "not filtering by it" — never 0, which is a
 * legitimate value the recruiter can type.
 */
export interface PipelineFilters {
  /** Minimum match percentage, inclusive. */
  minMatch: number | null;
  /** Exact city name, or '' for every city. */
  city: string;
  studying: 'all' | 'yes' | 'no';
  /** Salary expectation bounds, both inclusive. */
  minSalary: number | null;
  maxSalary: number | null;
  /** Minimum years of experience, inclusive. */
  minExperience: number | null;
}

export const EMPTY_FILTERS: PipelineFilters = {
  minMatch: null,
  city: '',
  studying: 'all',
  minSalary: null,
  maxSalary: null,
  minExperience: null,
};

function passesMatch(card: PipelineCard, minMatch: number | null): boolean {
  if (minMatch === null) return true;
  // A candidate whose CV is still being analyzed has no score yet. Keeping them
  // visible under a match filter would misrepresent them as qualifying.
  if (card.matchStatus === 'analyzing' || card.matchPercent === null) return false;
  return card.matchPercent >= minMatch;
}

function passesSalary(
  card: PipelineCard,
  minSalary: number | null,
  maxSalary: number | null,
): boolean {
  if (minSalary === null && maxSalary === null) return true;
  // An undeclared expectation is unknown, not zero — it cannot be claimed to
  // fall inside any range the recruiter asked for.
  if (card.salaryExpectation === null) return false;
  if (minSalary !== null && card.salaryExpectation < minSalary) return false;
  if (maxSalary !== null && card.salaryExpectation > maxSalary) return false;
  return true;
}

function passesExperience(card: PipelineCard, minExperience: number | null): boolean {
  if (minExperience === null) return true;
  // An undeclared experience is unknown, not zero — it cannot be claimed to
  // meet any minimum the recruiter asked for.
  if (card.yearsOfExperience === null) return false;
  return card.yearsOfExperience >= minExperience;
}

export function filterCards(
  cards: PipelineCard[],
  filters: PipelineFilters,
): PipelineCard[] {
  return cards.filter((card) => {
    if (!passesMatch(card, filters.minMatch)) return false;
    if (filters.city !== '' && card.city !== filters.city) return false;
    if (filters.studying === 'yes' && !card.isStudying) return false;
    if (filters.studying === 'no' && card.isStudying) return false;
    if (!passesSalary(card, filters.minSalary, filters.maxSalary)) return false;
    if (!passesExperience(card, filters.minExperience)) return false;
    return true;
  });
}

/**
 * City options built from the board's own candidates rather than the full city
 * catalog, so the recruiter never picks a city that would return nothing.
 */
export function cityOptionsFrom(cards: PipelineCard[]): string[] {
  const cities = new Set<string>();
  for (const card of cards) {
    if (card.city) cities.add(card.city);
  }
  return [...cities].sort((a, b) => a.localeCompare(b, 'es'));
}

export function hasActiveFilters(filters: PipelineFilters): boolean {
  return (
    filters.minMatch !== null ||
    filters.city !== '' ||
    filters.studying !== 'all' ||
    filters.minSalary !== null ||
    filters.maxSalary !== null ||
    filters.minExperience !== null
  );
}

// ─── URL round-trip ──────────────────────────────────────────────────────────

/**
 * Query-param names the filters travel under.
 *
 * The filters live in the URL rather than in component state alone because the
 * recruiter leaves the board constantly — opening a candidate unmounts it, and
 * a filter set that dies on every visit means retyping it dozens of times a day.
 * The URL also survives a reload and can be shared as-is.
 */
export const FILTER_PARAM_KEYS = [
  'minMatch',
  'city',
  'studying',
  'minSalary',
  'maxSalary',
  'minExperience',
] as const;

/** A plain query bag — what a server page's `searchParams` already looks like. */
export type FilterQuery = Record<string, string | undefined>;

function paramToNumberOrNull(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Reads the filters back out of a URL, ignoring anything unparseable. */
export function parseFilters(query: FilterQuery): PipelineFilters {
  const studying = query.studying;
  return {
    minMatch: paramToNumberOrNull(query.minMatch),
    city: query.city ?? '',
    studying: studying === 'yes' || studying === 'no' ? studying : 'all',
    minSalary: paramToNumberOrNull(query.minSalary),
    maxSalary: paramToNumberOrNull(query.maxSalary),
    minExperience: paramToNumberOrNull(query.minExperience),
  };
}

/**
 * Serializes only the active filters, so an untouched board keeps a clean URL
 * and `parseFilters(filtersToParams(f))` round-trips back to `f`.
 */
export function filtersToParams(filters: PipelineFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.minMatch !== null) params.minMatch = String(filters.minMatch);
  if (filters.city !== '') params.city = filters.city;
  if (filters.studying !== 'all') params.studying = filters.studying;
  if (filters.minSalary !== null) params.minSalary = String(filters.minSalary);
  if (filters.maxSalary !== null) params.maxSalary = String(filters.maxSalary);
  if (filters.minExperience !== null) params.minExperience = String(filters.minExperience);
  return params;
}
