import { type Role } from '../components/roles/mockRoles';

async function handleResponse<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (res.ok) {
    return res.json() as Promise<T>;
  }
  // Surface the backend detail when available (e.g. 409 conflict messages)
  let detail = fallbackMsg;
  try {
    const body = (await res.json()) as { error?: string; detail?: string };
    detail = body.detail ?? body.error ?? fallbackMsg;
  } catch {}
  const err = new Error(detail);
  (err as any).status = res.status;
  throw err;
}

function mapRole(r: any): Role {
  return {
    ...r,
    permissionIds: new Set(r.permissionIds as string[]),
  } as Role;
}

export async function listRoles(): Promise<Role[]> {
  const res = await fetch('/api/auth/roles', { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return (data as any[]).map(mapRole);
  }
  throw new Error((data as { error?: string }).error ?? 'Error al cargar los roles');
}

export async function createRole(data: { name: string; description: string }): Promise<Role> {
  const res = await fetch('/api/auth/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const role = await handleResponse<any>(res, 'Error al crear el rol');
  return mapRole(role);
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissionIds?: string[] },
): Promise<Role> {
  const res = await fetch(`/api/auth/roles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const role = await handleResponse<any>(res, 'Error al actualizar el rol');
  return mapRole(role);
}

export async function deleteRole(id: string): Promise<void> {
  const res = await fetch(`/api/auth/roles/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    let detail = 'Error al eliminar el rol';
    try {
      const body = (await res.json()) as { error?: string; detail?: string };
      detail = body.detail ?? body.error ?? detail;
    } catch {}
    const err = new Error(detail);
    (err as any).status = res.status;
    throw err;
  }
}
