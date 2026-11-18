import type { CandidateDirectoryEntry } from "./types";

export interface CandidateDirectoryRow extends CandidateDirectoryEntry {
  rowId: string;
  applicationId?: string;
  lastAppliedAt?: string;
}

function applicationTime(date?: string): number {
  const time = date ? Date.parse(date) : NaN;
  return Number.isFinite(time) ? time : 0;
}

export function compareLatestApplications(a: CandidateDirectoryRow, b: CandidateDirectoryRow): number {
  return applicationTime(b.lastAppliedAt) - applicationTime(a.lastAppliedAt)
    || applicationTime(b.vacancies[0]?.appliedAt) - applicationTime(a.vacancies[0]?.appliedAt)
    || Number(b.id) - Number(a.id);
}

export function getCandidateDirectoryRows(entries: CandidateDirectoryEntry[]): CandidateDirectoryRow[] {
  return entries.flatMap<CandidateDirectoryRow>((entry) => {
    const lastAppliedAt = entry.vacancies.reduce<string | undefined>((latest, vacancy) =>
      applicationTime(vacancy.appliedAt) > applicationTime(latest) ? vacancy.appliedAt : latest,
    undefined);
    return entry.vacancies.length
    ? entry.vacancies.map((vacancy, index) => ({
        ...entry,
        lastAppliedAt,
        rowId: `${entry.id}:${vacancy.applicationId ?? `${vacancy.vacancyId}:${index}`}`,
        applicationId: vacancy.applicationId,
        vacancies: [vacancy],
      }))
    : [{ ...entry, rowId: `${entry.id}:none`, vacancies: [] }];
  });
}
