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
  const body = await request.json() as { name?: string; description?: string; is_active?: boolean };
  const res = await authedFetch(`/org/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return NextResponse.json(await res.json());
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await authedFetch(`/org/departments/${id}`, { method: "DELETE" });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return new NextResponse(null, { status: 204 });
}
