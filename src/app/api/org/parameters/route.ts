import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { backendGet } from "@/lib/backendFetch";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendPage<T> { items: T[]; total: number; }
export interface BackendParam {
  id: number; type: string; code: string; name: string; is_active: boolean;
}

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
  const type = searchParams.get("type") ?? "";
  const includeInactive = searchParams.get("include_inactive") === "true";
  let path = type ? `/org/parameters?type=${type}&size=100` : `/org/parameters?size=100`;
  if (includeInactive) path += "&include_inactive=true";
  try {
    const data = await backendGet<BackendPage<BackendParam>>(path);
    return NextResponse.json(data.items);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { type: string; code: string; name: string };
  const res = await authedFetch("/org/parameters", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return NextResponse.json(await res.json(), { status: 201 });
}
