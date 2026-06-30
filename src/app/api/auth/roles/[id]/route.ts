import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPatch, backendDelete, backendPost } from "@/lib/backendFetch";
import { computeRolePermissionSync, getRoleUserCounts } from "@/lib/rolePermissions";

/** Roles seeded by the backend whose identity/permissions must not be mutated here. */
const SYSTEM_ROLE_NAMES = new Set(["admin", "candidate"]);

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendRole {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}
interface BackendPermission {
  id: number;
  code: string;
  name: string;
}

function backendStatusFromError(error: unknown): number {
  const msg = String(error);
  if (msg.includes("Backend 409")) return 409;
  if (msg.includes("Backend 404")) return 404;
  if (msg.includes("Backend 400")) return 400;
  return 500;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const roleId = Number(id);

  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      permissionIds?: string[];
    };

    // Resolve the role's identity up front. System roles (admin/candidate) are
    // immutable through this screen: admin holds every permission, so a single
    // save here could strip its access and lock everyone out. Reject mutations.
    const existingRole = await backendGet<BackendRole>(`/auth/roles/${roleId}`);
    const isSystemRole = SYSTEM_ROLE_NAMES.has(existingRole.name);

    let updatedRole = existingRole;

    if (!isSystemRole) {
      // 1. Update basic fields if provided
      const patchPayload: Record<string, unknown> = {};
      if (body.name !== undefined) patchPayload.name = body.name;
      if (body.description !== undefined) patchPayload.description = body.description || null;
      if (Object.keys(patchPayload).length > 0) {
        updatedRole = await backendPatch<BackendRole>(`/auth/roles/${roleId}`, patchPayload);
      }

      // 2. Sync permissions if provided — only within the manageable surface,
      //    so permissions the UI cannot show are preserved untouched.
      if (body.permissionIds !== undefined) {
        const [allPermissionsData, currentPermissions] = await Promise.all([
          backendGet<BackendPage<BackendPermission>>("/auth/permissions?size=300"),
          backendGet<BackendPermission[]>(`/auth/roles/${roleId}/permissions`),
        ]);

        const permissionIdByCode = new Map(allPermissionsData.items.map((p) => [p.code, p.id]));
        const knownCodes = new Set(allPermissionsData.items.map((p) => p.code));
        const { toGrant, toRevoke } = computeRolePermissionSync(
          currentPermissions,
          body.permissionIds,
          permissionIdByCode,
          knownCodes,
        );

        const promises: Promise<unknown>[] = [];
        for (const targetId of toGrant) {
          promises.push(
            backendPost(`/auth/roles/${roleId}/permissions`, {
              permission_id: targetId,
            }).catch((e) => {
              console.error(`Error granting permission ${targetId} to role ${roleId}:`, e);
            }),
          );
        }
        for (const revokeId of toRevoke) {
          promises.push(
            backendDelete(`/auth/roles/${roleId}/permissions/${revokeId}`).catch((e) => {
              console.error(`Error revoking permission ${revokeId} from role ${roleId}:`, e);
            }),
          );
        }

        await Promise.all(promises);
      }
    }

    const userCounts = await getRoleUserCounts();

    return NextResponse.json({
      id: String(updatedRole.id),
      name: updatedRole.name,
      description: updatedRole.description ?? "",
      usersCount: userCounts.get(updatedRole.name) ?? 0,
      isSystem: isSystemRole,
      permissionIds: body.permissionIds ?? [],
      isActive: updatedRole.is_active,
    });
  } catch (error) {
    const status = backendStatusFromError(error);
    return NextResponse.json({ error: String(error) }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const roleId = Number(id);

  try {
    await backendDelete(`/auth/roles/${roleId}`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = backendStatusFromError(error);
    return NextResponse.json({ error: String(error) }, { status });
  }
}
