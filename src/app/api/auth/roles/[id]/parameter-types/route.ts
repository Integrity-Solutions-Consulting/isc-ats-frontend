import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPut, backendErrorResponse } from "@/lib/backendFetch";

interface BackendRoleParameterTypes {
  parameter_types: string[];
}

// Proxies a role's writable catalog-parameter-types allowlist: GET reads the
// role's current grants, PUT replaces the full set atomically. Mirrors the
// role-permissions proxying pattern in ../route.ts (PATCH), but as its own
// resource since the backend models it as a separate endpoint.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await backendGet<BackendRoleParameterTypes>(`/auth/roles/${id}/parameter-types`);
    return NextResponse.json(data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as { parameter_types?: string[] };
    const data = await backendPut<BackendRoleParameterTypes>(`/auth/roles/${id}/parameter-types`, {
      parameter_types: body.parameter_types ?? [],
    });
    return NextResponse.json(data);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
