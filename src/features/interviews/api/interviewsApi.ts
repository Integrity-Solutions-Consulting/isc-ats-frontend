import type {
  CreateInterviewPayload,
  Interviewer,
  OfferSlotsPayload,
  Slot,
} from '../types';

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
}

export async function listInterviewers(): Promise<Interviewer[]> {
  const res = await fetch('/api/recruitment/interviews/interviewers', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getAvailableSlots(
  interviewerId: number,
  targetDate: string,
): Promise<Slot[]> {
  const res = await fetch(
    `/api/recruitment/interviews/available-slots?interviewer_id=${interviewerId}&target_date=${targetDate}`,
    { cache: 'no-store' },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createInterview(payload: CreateInterviewPayload): Promise<void> {
  const res = await fetch('/api/recruitment/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'No se pudo agendar la entrevista'));
}

export async function offerSlots(payload: OfferSlotsPayload): Promise<void> {
  const res = await fetch('/api/recruitment/interviews/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'No se pudo enviar la invitación'));
}
