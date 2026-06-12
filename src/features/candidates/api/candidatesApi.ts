import type {
  AIAnalysis,
  Candidate,
  CandidateApplication,
  CandidateNote,
  OtherApplication,
} from '../types';
import type { CandidateStageStatus } from '@/shared/types/pipeline';
import { serverAuthHeaders } from '@/lib/serverAuthHeaders';
import { INTERNAL_BASE_URL as BASE } from '@/lib/internalBaseUrl';

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getCandidate(candidateId: string): Promise<Candidate | null> {
  if (!/^\d+$/.test(candidateId)) return null;
  try {
    const res = await fetch(`${BASE}/api/recruitment/candidates/${candidateId}`, {
      cache: 'no-store',
      headers: await serverAuthHeaders(),
    });
    if (res.ok) return res.json() as Promise<Candidate | null>;
  } catch {}
  return null;
}

export async function getCandidateApplication(
  applicationId: string,
): Promise<CandidateApplication | null> {
  if (!/^\d+$/.test(applicationId)) return null;
  try {
    const res = await fetch(`${BASE}/api/recruitment/applications/${applicationId}`, {
      cache: 'no-store',
      headers: await serverAuthHeaders(),
    });
    if (res.ok) return res.json() as Promise<CandidateApplication | null>;
  } catch {}
  return null;
}

export async function getAIAnalysis(applicationId: string): Promise<AIAnalysis | null> {
  if (!/^\d+$/.test(applicationId)) return null;
  try {
    const res = await fetch(`${BASE}/api/recruitment/applications/${applicationId}/analysis`, {
      cache: 'no-store',
      headers: await serverAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json() as AIAnalysis | null;
      return data;
    }
  } catch {}
  return null;
}

export async function getCandidateNotes(applicationId: string): Promise<CandidateNote[]> {
  if (!/^\d+$/.test(applicationId)) return [];
  try {
    const res = await fetch(`${BASE}/api/recruitment/application-notes?application_id=${applicationId}`, { cache: 'no-store' });
    if (res.ok) return res.json() as Promise<CandidateNote[]>;
  } catch {}
  return [];
}

export async function getOtherApplications(
  candidateId: string,
  excludeApplicationId?: string,
): Promise<OtherApplication[]> {
  if (!/^\d+$/.test(candidateId)) return [];
  try {
    const res = await fetch(
      `${BASE}/api/recruitment/applications?candidate_id=${candidateId}`,
      { cache: 'no-store', headers: await serverAuthHeaders() },
    );
    if (!res.ok) return [];
    const all = (await res.json()) as OtherApplication[] | { error: string };
    if ('error' in all) return [];
    // Drop the application the user is currently viewing.
    return all.filter((a) => a.applicationId !== excludeApplicationId);
  } catch {
    return [];
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function addNote(
  applicationId: string,
  body: string,
  _author: { name: string; initials: string },
): Promise<CandidateNote> {
  const res = await fetch('/api/recruitment/application-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_id: applicationId, content: body }),
  });
  if (res.ok) return res.json() as Promise<CandidateNote>;
  throw new Error('Failed to add note');
}

export async function moveToNextStage(
  applicationId: string,
  toStageId: string,
): Promise<void> {
  // Moving to a new stage resets the sub-status: each stage starts with no
  // sub-status until staff sets one explicitly.
  await fetch(`/api/recruitment/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_stage_id: Number(toStageId), current_status_id: null }),
  });
}

export async function updateStageStatus(
  applicationId: string,
  statusId: number,
): Promise<void> {
  await fetch(`/api/recruitment/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_status_id: statusId }),
  });
}

export async function rejectCandidate(applicationId: string): Promise<void> {
  // A rejected candidate is out of the pipeline, so it carries no sub-status.
  await fetch(`/api/recruitment/applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_stage_id: null, current_status_id: null }),
  });
}

// ─── Talent pool ────────────────────────────────────────────────────────────

export async function addToTalentPool(
  candidateId: string,
  sourceVacancyId: string,
): Promise<void> {
  const res = await fetch('/api/talent-pool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: Number(candidateId),
      source_vacancy_id: Number(sourceVacancyId),
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'No se pudo añadir al banco de talento');
  }
}
