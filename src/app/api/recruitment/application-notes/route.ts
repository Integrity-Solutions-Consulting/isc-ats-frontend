import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { backendGet } from "@/lib/backendFetch";
import type { CandidateNote } from "@/features/candidates/types";

// BackendUser is no longer needed — author_name is now resolved by the backend.

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendNote {
  id: number;
  application_id: number;
  content: string;
  created_at: string;
  created_by: number | null;
  /** Resolved by the backend serializer — "Nombre Apellido" derived from email. */
  author_name?: string;
}
interface BackendPage<T> { items: T[]; total: number; }

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

function initialsFromName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function mapNote(n: BackendNote): CandidateNote {
  const authorName = n.author_name && n.author_name !== "Staff" ? n.author_name : (n.author_name ?? "Staff");
  return {
    id: String(n.id),
    applicationId: String(n.application_id),
    authorName,
    authorInitials: initialsFromName(authorName),
    body: n.content,
    createdAt: n.created_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get("application_id") ?? "";
  if (!applicationId) return NextResponse.json([]);
  try {
    const data = await backendGet<BackendPage<BackendNote>>(
      `/recruitment/application-notes?application_id=${applicationId}&size=100`,
    );
    return NextResponse.json(data.items.map(mapNote));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { application_id: string; content: string };
  const res = await authedFetch("/recruitment/application-notes", {
    method: "POST",
    body: JSON.stringify({
      application_id: Number(body.application_id),
      content: body.content,
    }),
  });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  const created = (await res.json()) as BackendNote;
  return NextResponse.json(mapNote(created), { status: 201 });
}
