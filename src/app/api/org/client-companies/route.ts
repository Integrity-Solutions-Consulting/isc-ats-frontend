import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendGet } from "@/lib/backendFetch";
import { cookies } from "next/headers";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendPage<T> {
  items: T[];
  total: number;
}

export interface BackendCompany {
  id: number;
  name: string;
  is_active: boolean;
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

export async function GET() {
  try {
    const data = await backendGet<BackendPage<BackendCompany>>(
      "/org/client-companies?size=100",
    );
    return NextResponse.json(data.items);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name: string };
    const res = await authedFetch("/org/client-companies", {
      method: "POST",
      body: JSON.stringify({ name: body.name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
