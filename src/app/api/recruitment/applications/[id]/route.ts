import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { backendGet } from "@/lib/backendFetch";
import type { CandidateApplication } from "@/features/candidates/types";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendApplication {
  id: number; vacancy_id: number; candidate_id: number;
  current_stage_id: number | null; current_status_id: number | null;
  match_score: string | null;
  applied_at: string; updated_at: string | null; is_active: boolean;
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await backendGet<BackendApplication>(`/recruitment/applications/${id}`);
    const app: CandidateApplication = {
      id: String(data.id),
      candidateId: String(data.candidate_id),
      vacancyId: String(data.vacancy_id),
      stageId: data.current_stage_id ? String(data.current_stage_id) : "rejected",
      currentStatusId: data.current_status_id ?? null,
      stageStatus: "pending_review",
      matchPercent: data.match_score ? parseFloat(data.match_score) : null,
      matchStatus: data.match_score ? "done" : "analyzing",
      salaryExpectation: 0,
      createdAt: data.applied_at,
      updatedAt: data.updated_at ?? data.applied_at,
    };
    return NextResponse.json(app);
  } catch {
    return NextResponse.json(null);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json() as { current_stage_id?: number | null; current_status_id?: number | null };
  const res = await authedFetch(`/recruitment/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  return NextResponse.json(await res.json());
}
