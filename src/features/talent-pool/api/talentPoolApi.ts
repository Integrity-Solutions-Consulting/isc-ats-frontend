import type { TalentPoolEntry, TalentPoolFilters } from "../types";

export async function listTalentPool(
  filters?: Partial<TalentPoolFilters>,
): Promise<TalentPoolEntry[]> {
  const qs = new URLSearchParams();
  if (filters?.search) qs.set("search", filters.search);
  if (filters?.skill) qs.set("skill", filters.skill);
  if (filters?.tool) qs.set("tool", filters.tool);
  if (filters?.vacancyId) qs.set("source_vacancy_id", filters.vacancyId);

  const queryStr = qs.toString();
  const url = queryStr ? `/api/talent-pool?${queryStr}` : "/api/talent-pool";

  const res = await fetch(url, { cache: "no-store" });
  if (res.ok) return res.json() as Promise<TalentPoolEntry[]>;
  return [];
}

export interface TalentPoolMembership {
  inPool: boolean;
  entryId: number | null;
}

/** Whether a candidate is already in the talent pool for a given source vacancy. */
export async function getTalentPoolMembership(
  candidateId: string,
  sourceVacancyId: string,
): Promise<TalentPoolMembership> {
  const qs = new URLSearchParams({
    candidate_id: candidateId,
    source_vacancy_id: sourceVacancyId,
  });
  const res = await fetch(`/api/talent-pool/membership?${qs.toString()}`, {
    cache: "no-store",
  });
  if (res.ok) return res.json() as Promise<TalentPoolMembership>;
  return { inPool: false, entryId: null };
}

export async function removeFromTalentPool(id: string): Promise<void> {
  const res = await fetch(`/api/talent-pool/${id}`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error("Error al remover el candidato del banco de talento");
}
