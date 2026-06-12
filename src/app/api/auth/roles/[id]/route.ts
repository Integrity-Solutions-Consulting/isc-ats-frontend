import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPatch, backendDelete, backendPost } from "@/lib/backendFetch";
import { FRONTEND_TO_BACKEND, getRoleUserCounts } from "@/lib/rolePermissions";

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

    const patchPayload: Record<string, any> = {};
    if (body.name !== undefined) patchPayload.name = body.name;
    if (body.description !== undefined) patchPayload.description = body.description || null;

    // 1. Update basic fields if provided
    let updatedRole = { id: roleId, name: "", description: null, is_active: true } as BackendRole;
    if (Object.keys(patchPayload).length > 0) {
      updatedRole = await backendPatch<BackendRole>(`/auth/roles/${roleId}`, patchPayload);
    } else {
      updatedRole = await backendGet<BackendRole>(`/auth/roles/${roleId}`);
    }

    // 2. Sync permissions if provided
    if (body.permissionIds !== undefined) {
      const [allPermissionsData, currentPermissions] = await Promise.all([
        backendGet<BackendPage<BackendPermission>>("/auth/permissions?size=300"),
        backendGet<BackendPermission[]>(`/auth/roles/${roleId}/permissions`),
      ]);

      const permissionIdByCode = new Map(allPermissionsData.items.map((p) => [p.code, p.id]));

      // Determine target backend permission IDs
      const targetPermissionIds = new Set<number>();
      for (const fePermId of body.permissionIds) {
        const beCode = FRONTEND_TO_BACKEND[fePermId];
        if (beCode) {
          const beId = permissionIdByCode.get(beCode);
          if (beId !== undefined) {
            targetPermissionIds.add(beId);
          }
        }
      }

      const currentPermissionIds = new Set(currentPermissions.map((p) => p.id));
      const promises: Promise<any>[] = [];

      // Grant new permissions
      for (const targetId of targetPermissionIds) {
        if (!currentPermissionIds.has(targetId)) {
          promises.push(
            backendPost(`/auth/roles/${roleId}/permissions`, {
              permission_id: targetId,
            }).catch((e) => {
              console.error(`Error granting permission ${targetId} to role ${roleId}:`, e);
            }),
          );
        }
      }

      // Revoke removed permissions
      for (const currentPerm of currentPermissions) {
        if (!targetPermissionIds.has(currentPerm.id)) {
          promises.push(
            backendDelete(`/auth/roles/${roleId}/permissions/${currentPerm.id}`).catch((e) => {
              console.error(`Error revoking permission ${currentPerm.id} from role ${roleId}:`, e);
            }),
          );
        }
      }

      await Promise.all(promises);
    }

    const userCounts = await getRoleUserCounts();

    return NextResponse.json({
      id: String(updatedRole.id),
      name: updatedRole.name,
      description: updatedRole.description ?? "",
      usersCount: userCounts.get(updatedRole.name) ?? 0,
      isSystem: updatedRole.name === "admin" || updatedRole.name === "candidate",
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
