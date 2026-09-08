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
  /** Free-text search over the candidate's name, or '' for no search. */
  name: string;
  /** Minimum match percentage, inclusive. */
  minMatch: number | null;
  /** Exact city name, or '' for every city. */
  city: string;
  /** Exact university name, or '' for every university. */
  university: string;
  studying: 'all' | 'yes' | 'no';
  /** Salary expectation bounds, both inclusive. */
  minSalary: number | null;
  maxSalary: number | null;
  /** Minimum years of experience, inclusive. */
  minExperience: number | null;
  /**
   * Last-activity bounds as local calendar days (`YYYY-MM-DD`), both inclusive.
   * '' means that end is unbounded.
   */
  updatedFrom: string;
  updatedTo: string;
}

export const EMPTY_FILTERS: PipelineFilters = {
  name: '',
  minMatch: null,
  city: '',
  university: '',
  studying: 'all',
  minSalary: null,
  maxSalary: null,
  minExperience: null,
  updatedFrom: '',
  updatedTo: '',
};

/**
 * Folds case and accents so "perez" matches "Pérez" and "munoz" matches "Muñoz".
 *
 * NFD splits an accented letter into base letter + combining mark, which the
 * diacritic class then strips — leaving plain ASCII to compare against.
 */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Every word typed must appear somewhere in the name, in any order.
 *
 * A plain substring test would fail the common Ecuadorian case of two given
 * names and two surnames: searching "Juan Muñoz" would not find "Juan Carlos
 * Pérez Muñoz", because the words are not adjacent.
 */
function passesName(card: PipelineCard, query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const name = normalizeText(card.candidateName);
  return words.every((word) => name.includes(word));
}

/**
 * The local calendar day of an ISO timestamp, as `YYYY-MM-DD`.
 *
 * The date inputs speak the recruiter's local days, but `updatedAt` arrives as a
 * UTC-offset timestamp. Slicing the string would bucket anything that happened
 * after 19:00 in Ecuador (UTC-5) into the following day, so a candidate touched
 * last night would not show up under "yesterday".
 */
function localDayOf(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DD` strings compare correctly with `<` and `>`, being zero-padded. */
function passesUpdated(card: PipelineCard, from: string, to: string): boolean {
  if (from === '' && to === '') return true;
  const day = localDayOf(card.updatedAt);
  if (day === null) return false;
  if (from !== '' && day < from) return false;
  if (to !== '' && day > to) return false;
  return true;
}

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
    if (!passesName(card, filters.name)) return false;
    if (!passesMatch(card, filters.minMatch)) return false;
    if (filters.city !== '' && card.city !== filters.city) return false;
    if (filters.university !== '' && card.university !== filters.university) return false;
    if (filters.studying === 'yes' && !card.isStudying) return false;
    if (filters.studying === 'no' && card.isStudying) return false;
    if (!passesSalary(card, filters.minSalary, filters.maxSalary)) return false;
    if (!passesExperience(card, filters.minExperience)) return false;
    if (!passesUpdated(card, filters.updatedFrom, filters.updatedTo)) return false;
    return true;
  });
}

/**
 * Options built from the board's own candidates rather than the full catalog, so
 * the recruiter never picks a value that would return an empty board.
 */
function optionsFrom(
  cards: PipelineCard[],
  pick: (card: PipelineCard) => string | null,
): string[] {
  const values = new Set<string>();
  for (const card of cards) {
    const value = pick(card);
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'es'));
}

export function cityOptionsFrom(cards: PipelineCard[]): string[] {
  return optionsFrom(cards, (card) => card.city);
}

export function universityOptionsFrom(cards: PipelineCard[]): string[] {
  return optionsFrom(cards, (card) => card.university);
}

export function hasActiveFilters(filters: PipelineFilters): boolean {
  return (
    filters.name !== '' ||
    filters.minMatch !== null ||
    filters.city !== '' ||
    filters.university !== '' ||
    filters.studying !== 'all' ||
    filters.minSalary !== null ||
    filters.maxSalary !== null ||
    filters.minExperience !== null ||
    filters.updatedFrom !== '' ||
    filters.updatedTo !== ''
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
  'name',
  'minMatch',
  'city',
  'university',
  'studying',
  'minSalary',
  'maxSalary',
  'minExperience',
  'updatedFrom',
  'updatedTo',
] as const;

/** A plain query bag — what a server page's `searchParams` already looks like. */
export type FilterQuery = Record<string, string | undefined>;

function paramToNumberOrNull(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Only a zero-padded `YYYY-MM-DD` is accepted. A hand-edited or truncated link
 * must not silently empty the board, and loose parsing would let "2026-9-5"
 * through, where string comparison against padded days gives wrong answers.
 */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function paramToDay(raw: string | undefined): string {
  return raw !== undefined && ISO_DAY.test(raw) ? raw : '';
}

/** Reads the filters back out of a URL, ignoring anything unparseable. */
export function parseFilters(query: FilterQuery): PipelineFilters {
  const studying = query.studying;
  return {
    name: query.name ?? '',
    minMatch: paramToNumberOrNull(query.minMatch),
    city: query.city ?? '',
    university: query.university ?? '',
    studying: studying === 'yes' || studying === 'no' ? studying : 'all',
    minSalary: paramToNumberOrNull(query.minSalary),
    maxSalary: paramToNumberOrNull(query.maxSalary),
    minExperience: paramToNumberOrNull(query.minExperience),
    updatedFrom: paramToDay(query.updatedFrom),
    updatedTo: paramToDay(query.updatedTo),
  };
}

/**
 * Serializes only the active filters, so an untouched board keeps a clean URL
 * and `parseFilters(filtersToParams(f))` round-trips back to `f`.
 */
export function filtersToParams(filters: PipelineFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.name !== '') params.name = filters.name;
  if (filters.minMatch !== null) params.minMatch = String(filters.minMatch);
  if (filters.city !== '') params.city = filters.city;
  if (filters.university !== '') params.university = filters.university;
  if (filters.studying !== 'all') params.studying = filters.studying;
  if (filters.minSalary !== null) params.minSalary = String(filters.minSalary);
  if (filters.maxSalary !== null) params.maxSalary = String(filters.maxSalary);
  if (filters.minExperience !== null) params.minExperience = String(filters.minExperience);
  if (filters.updatedFrom !== '') params.updatedFrom = filters.updatedFrom;
  if (filters.updatedTo !== '') params.updatedTo = filters.updatedTo;
  return params;
}
