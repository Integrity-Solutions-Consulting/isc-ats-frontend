import { type ModuleDef, TOTAL_PERMS } from './permissions';
import { type Role } from './mockRoles';

export function permFraction(role: Role): number {
  return Math.round((role.permissionIds.size / TOTAL_PERMS) * 100);
}

export function moduleGranted(role: Role, mod: ModuleDef): 'all' | 'partial' | 'none' {
  const ids = mod.permissions.map((p) => p.id);
  const on = ids.filter((id) => role.permissionIds.has(id)).length;
  if (on === ids.length) return 'all';
  if (on > 0) return 'partial';
  return 'none';
}
