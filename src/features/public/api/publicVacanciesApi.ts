import { INTERNAL_BASE_URL as BASE } from '@/lib/internalBaseUrl';
import type { CandidateVacancy } from '@/features/candidate-portal/types';

/**
 * Fetches the public vacancy list from the BFF route handler.
 * No auth token required — safe for anonymous server components.
 */
export async function listPublicVacancies(): Promise<CandidateVacancy[]> {
  const res = await fetch(`${BASE}/api/public/vacancies`, {
    cache: 'no-store',
  });
  if (res.ok) return res.json() as Promise<CandidateVacancy[]>;
  return [];
}

/**
 * Fetches a single public vacancy from the BFF route handler.
 * No auth token required — safe for anonymous server components.
 */
export async function getPublicVacancy(id: string): Promise<CandidateVacancy | null> {
  if (!/^\d+$/.test(id)) return null;
  const res = await fetch(`${BASE}/api/public/vacancies/${id}`, {
    cache: 'no-store',
  });
  if (res.ok) return res.json() as Promise<CandidateVacancy | null>;
  return null;
}
