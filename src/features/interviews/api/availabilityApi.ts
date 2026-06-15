import type { AvailabilityCreatePayload, AvailabilityWindow } from '../types';

export async function listMyAvailability(): Promise<AvailabilityWindow[]> {
  const res = await fetch('/api/recruitment/interviewer-availability', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createAvailability(
  payload: AvailabilityCreatePayload,
): Promise<AvailabilityWindow> {
  const res = await fetch('/api/recruitment/interviewer-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'No se pudo guardar la disponibilidad');
  }
  return res.json();
}

export async function deleteAvailability(id: number): Promise<void> {
  const res = await fetch(`/api/recruitment/interviewer-availability/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('No se pudo eliminar la disponibilidad');
}
