import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendErrorResponse, backendGet, backendPatch } from "@/lib/backendFetch";
import type { CandidateApplication } from "@/features/candidates/types";

interface BackendApplication {
  id: number; vacancy_id: number; candidate_id: number;
  current_stage_id: number | null; current_status_id: number | null;
  match_score: string | null;
  applied_at: string; updated_at: string | null; is_active: boolean;
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
  const body = await request.json() as {
    current_stage_id?: number | null;
    current_status_id?: number | null;
    // Required by the backend when this move results in current_stage_id=null
    // (a move into the virtual Rechazados column) — see RejectionReasonRequiredError.
    rejection_reason?: string | null;
  };
  try {
    const updated = await backendPatch(`/recruitment/applications/${id}`, body);
    return NextResponse.json(updated);
  } catch (error) {
    return backendErrorResponse(error);
  }
}
