import { type ProfileTemplateRecord } from './mockData';
import { INTERNAL_BASE_URL as BASE } from '@/lib/internalBaseUrl';

export async function listTemplates(): Promise<ProfileTemplateRecord[]> {
  const res = await fetch(`${BASE}/api/org/profile-templates`, { cache: 'no-store' });
  if (res.ok) return res.json() as Promise<ProfileTemplateRecord[]>;
  return [];
}

export async function getTemplate(id: string): Promise<ProfileTemplateRecord | null> {
  const res = await fetch(`${BASE}/api/org/profile-templates/${id}`, { cache: 'no-store' });
  if (res.ok) return res.json() as Promise<ProfileTemplateRecord | null>;
  return null;
}

export async function createTemplate(
  data: Omit<ProfileTemplateRecord, 'id'>,
): Promise<ProfileTemplateRecord> {
  const res = await fetch('/api/org/profile-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.ok) return res.json() as Promise<ProfileTemplateRecord>;
  throw new Error('Error al crear la plantilla');
}

export async function updateTemplate(
  id: string,
  data: Omit<ProfileTemplateRecord, 'id'>,
): Promise<ProfileTemplateRecord> {
  const res = await fetch(`/api/org/profile-templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.ok) return res.json() as Promise<ProfileTemplateRecord>;
  throw new Error('Error al actualizar la plantilla');
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/org/profile-templates/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || 'No se pudo eliminar la plantilla.');
  }
}

export async function reactivateTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/org/profile-templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: true }),
  });
  if (!res.ok) throw new Error('Error al reactivar la plantilla');
}
