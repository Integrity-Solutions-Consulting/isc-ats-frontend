import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost } from "@/lib/backendFetch";
import { BACKEND_TO_FRONTEND, getRoleUserCounts } from "@/lib/rolePermissions";

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendRole {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}
interface BackendPermission {
  id: number;
  code: string;
  name: string;
  module: string;
}

export async function GET() {
  try {
    const [rolesData, userCounts] = await Promise.all([
      backendGet<BackendPage<BackendRole>>("/auth/roles?size=100"),
      getRoleUserCounts(),
    ]);

    // Fetch permissions for each active role in parallel
    const rolesWithPermissions = await Promise.all(
      rolesData.items.map(async (role) => {
        let perms: BackendPermission[] = [];
        try {
          perms = await backendGet<BackendPermission[]>(`/auth/roles/${role.id}/permissions`);
        } catch {}

        const permissionIdsSet = new Set<string>();
        for (const p of perms) {
          const frontKeys = BACKEND_TO_FRONTEND[p.code] ?? [];
          for (const key of frontKeys) {
            permissionIdsSet.add(key);
          }
        }

        return {
          id: String(role.id),
          name: role.name,
          description: role.description ?? "",
          usersCount: userCounts.get(role.name) ?? 0,
          isSystem: role.name === "admin" || role.name === "candidate",
          permissionIds: Array.from(permissionIdsSet),
          isActive: role.is_active,
        };
      }),
    );

    return NextResponse.json(rolesWithPermissions);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      description: string;
    };

    const createdRole = await backendPost<BackendRole>("/auth/roles", {
      name: body.name,
      description: body.description || null,
    });

    return NextResponse.json(
      {
        id: String(createdRole.id),
        name: createdRole.name,
        description: createdRole.description ?? "",
        usersCount: 0,
        isSystem: false,
        permissionIds: [],
        isActive: createdRole.is_active,
      },
      { status: 201 },
    );
  } catch (error) {
    const msg = String(error);
    const status = msg.includes("Backend 409") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
