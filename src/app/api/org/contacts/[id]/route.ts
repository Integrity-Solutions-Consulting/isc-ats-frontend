import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

async function authedFetch(path: string, init?: RequestInit) {
  const store = await cookies();
  const token = store.get("access-token")?.value;
  return fetch(`${BACKEND}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json() as {
    firstName?: string; lastName?: string; email?: string; clientCompanyId?: string;
  };
  const payload: Record<string, unknown> = {};
  if (body.firstName !== undefined) payload.first_name = body.firstName;
  if (body.lastName !== undefined) payload.last_name = body.lastName;
  if (body.email !== undefined) payload.email = body.email;
  if (body.clientCompanyId !== undefined) payload.client_company_id = Number(body.clientCompanyId);

  const res = await authedFetch(`/org/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return NextResponse.json(await res.json());
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await authedFetch(`/org/contacts/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return new NextResponse(null, { status: 204 });
}
