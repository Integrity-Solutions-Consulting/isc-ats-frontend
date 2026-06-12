import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { backendGet } from "@/lib/backendFetch";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendPage<T> { items: T[]; total: number; }
export interface BackendDept { id: number; name: string; description: string | null; is_active: boolean; }

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("include_inactive") === "true";
  const path = `/org/departments?size=100${includeInactive ? "&include_inactive=true" : ""}`;
  try {
    const data = await backendGet<BackendPage<BackendDept>>(path);
    return NextResponse.json(data.items);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { name: string; description?: string };
  const res = await authedFetch("/org/departments", {
    method: "POST",
    body: JSON.stringify({ name: body.name, description: body.description ?? null }),
  });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return NextResponse.json(await res.json(), { status: 201 });
}
