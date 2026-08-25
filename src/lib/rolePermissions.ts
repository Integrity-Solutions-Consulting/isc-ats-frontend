import { backendGetAllPages } from "@/lib/backendPages";

export interface PermissionSyncPlan {
  toGrant: number[];
  toRevoke: number[];
}

/**
 * Computes which backend permission IDs to grant/revoke for a role given the
 * permission codes the user selected in the Roles screen.
 *
 * Critical invariant: only permissions whose code is in `knownCodes` (the
 * catalog the UI actually rendered) are ever revoked. Any permission the role
 * holds whose code is outside that set is preserved untouched — so a partial or
 * filtered catalog can never silently strip permissions the screen didn't show.
 */
export function computeRolePermissionSync(
  currentPermissions: { id: number; code: string }[],
  targetCodes: string[],
  permissionIdByCode: Map<string, number>,
  knownCodes: ReadonlySet<string>,
): PermissionSyncPlan {
  // Resolve the selected codes to backend permission IDs.
  const targetIds = new Set<number>();
  for (const code of targetCodes) {
    const id = permissionIdByCode.get(code);
    if (id !== undefined) targetIds.add(id);
  }

  const currentIds = new Set(currentPermissions.map((p) => p.id));

  const toGrant: number[] = [];
  for (const id of targetIds) {
    if (!currentIds.has(id)) toGrant.push(id);
  }

  const toRevoke: number[] = [];
  for (const perm of currentPermissions) {
    // Never touch a permission the catalog did not surface.
    if (!knownCodes.has(perm.code)) continue;
    if (!targetIds.has(perm.id)) toRevoke.push(perm.id);
  }

  return { toGrant, toRevoke };
}

interface BackendUserRoles {
  id: number;
  roles: string[];
}

/** Count of users assigned to each role, keyed by role name. */
export async function getRoleUserCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    // Every page, not just the first: counting a single 100-row page reported a
    // role as empty whenever its members happened to sit past that cut-off.
    const users = await backendGetAllPages<BackendUserRoles>("/auth/users");
    for (const user of users) {
      for (const roleName of user.roles) {
        counts.set(roleName, (counts.get(roleName) ?? 0) + 1);
      }
    }
  } catch {}
  return counts;
}
