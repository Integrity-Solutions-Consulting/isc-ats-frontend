import type { CandidateDirectoryEntry } from "./types";

export interface CandidateDirectoryRow extends CandidateDirectoryEntry {
  rowId: string;
  applicationId?: string;
}

export function getCandidateDirectoryRows(entries: CandidateDirectoryEntry[]): CandidateDirectoryRow[] {
  return entries.flatMap<CandidateDirectoryRow>((entry) => entry.vacancies.length
    ? entry.vacancies.map((vacancy, index) => ({
        ...entry,
        rowId: `${entry.id}:${vacancy.applicationId ?? `${vacancy.vacancyId}:${index}`}`,
        applicationId: vacancy.applicationId,
        vacancies: [vacancy],
      }))
    : [{ ...entry, rowId: `${entry.id}:none`, vacancies: [] }]);
}
