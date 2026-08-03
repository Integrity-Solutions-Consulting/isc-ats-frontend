import type { PortalUser } from '../types';

export async function listUsers(): Promise<PortalUser[]> {
  try {
    const res = await fetch('/api/auth/users', { cache: 'no-store' });
    if (res.ok) return res.json() as Promise<PortalUser[]>;
  } catch {}
  return [];
}

export async function listRoles(): Promise<{ id: number; name: string }[]> {
  try {
    const res = await fetch('/api/auth/roles', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json() as { id: string; name: string }[];
    // BFF /api/auth/roles returns id as string — convert back for the form
    return data.map((r) => ({ id: Number(r.id), name: r.name }));
  } catch {
    return [];
  }
}

export interface CreateUserPayload {
  email: string;
  password?: string;
  role_id: number;
  is_active: boolean;
}

export async function createUser(payload: CreateUserPayload): Promise<PortalUser> {
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    // No HTTP status in the text: it means nothing to the user and the real
    // status is already one click away in the browser's Network tab.
    throw new Error(body.error ?? 'No fue posible crear el usuario.');
  }
  return res.json() as Promise<PortalUser>;
}

export async function setUserActive(id: string, isActive: boolean): Promise<void> {
  const res = await fetch(`/api/auth/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'No fue posible actualizar el usuario.');
  }
}

export async function setUserRole(id: string, roleId: number): Promise<void> {
  const res = await fetch(`/api/auth/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role_id: roleId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'No fue posible cambiar el rol.');
  }
}
