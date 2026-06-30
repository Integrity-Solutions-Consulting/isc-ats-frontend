import type { TalentPoolEntry } from '../types';

export async function listTalentPool(): Promise<TalentPoolEntry[]> {
  const res = await fetch('/api/talent-pool', { cache: 'no-store' });
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
    cache: 'no-store',
  });
  if (res.ok) return res.json() as Promise<TalentPoolMembership>;
  return { inPool: false, entryId: null };
}

export async function removeFromTalentPool(id: string): Promise<void> {
  const res = await fetch(`/api/talent-pool/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al remover el candidato del banco de talento');
}
