import type { TalentPoolEntry } from '../types';

export async function listTalentPool(): Promise<TalentPoolEntry[]> {
  const res = await fetch('/api/talent-pool', { cache: 'no-store' });
  if (res.ok) return res.json() as Promise<TalentPoolEntry[]>;
  return [];
}

export async function removeFromTalentPool(id: string): Promise<void> {
  const res = await fetch(`/api/talent-pool/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al remover el candidato del banco de talento');
}
