import type { CandidateApplication, CandidateProfile, CandidateVacancy } from '../types';
import { serverAuthHeaders } from '@/lib/serverAuthHeaders';
import { INTERNAL_BASE_URL as BASE } from '@/lib/internalBaseUrl';

export async function listVacancies(): Promise<CandidateVacancy[]> {
  const res = await fetch(`${BASE}/api/candidate/vacancies`, {
    cache: 'no-store',
    headers: await serverAuthHeaders(),
  });
  if (res.ok) return res.json() as Promise<CandidateVacancy[]>;
  return [];
}

export async function getVacancy(id: string): Promise<CandidateVacancy | null> {
  if (!/^\d+$/.test(id)) return null;
  const res = await fetch(`${BASE}/api/candidate/vacancies/${id}`, {
    cache: 'no-store',
    headers: await serverAuthHeaders(),
  });
  if (res.ok) return res.json() as Promise<CandidateVacancy | null>;
  return null;
}

export async function getMyApplications(): Promise<CandidateApplication[]> {
  const res = await fetch(`${BASE}/api/candidate/applications`, {
    cache: 'no-store',
    headers: await serverAuthHeaders(),
  });
  if (res.ok) return res.json() as Promise<CandidateApplication[]>;
  return [];
}

export async function getMyProfile(): Promise<CandidateProfile | null> {
  const res = await fetch(`${BASE}/api/candidate/profile`, {
    cache: 'no-store',
    headers: await serverAuthHeaders(),
  });
  if (res.ok) return res.json() as Promise<CandidateProfile | null>;
  return null;
}

export async function applyToVacancy(vacancyId: string, salaryExpectation: number): Promise<void> {
  const res = await fetch('/api/candidate/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vacancyId, salaryExpectation }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? 'Error al postularse');
  }
}

export async function confirmInterviewOffer(
  interviewId: number,
  slot: { start: string; end: string },
): Promise<void> {
  const res = await fetch(`/api/recruitment/interviews/me/${interviewId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slot),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'No se pudo confirmar el horario');
  }
}
