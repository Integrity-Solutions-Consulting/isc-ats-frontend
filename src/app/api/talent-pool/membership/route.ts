import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendErrorResponse } from "@/lib/backendFetch";

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendTalentPoolEntry {
  id: number;
}

// Lightweight check: is a candidate already in the talent pool for a given
// source vacancy? Lets the staff UI derive the "added" button state from the
// server so it survives a page reload (and never offers a duplicate add).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get("candidate_id");
  const sourceVacancyId = searchParams.get("source_vacancy_id");

  if (!candidateId || !sourceVacancyId) {
    return NextResponse.json({ inPool: false, entryId: null });
  }

  try {
    const qs = new URLSearchParams({
      candidate_id: candidateId,
      source_vacancy_id: sourceVacancyId,
      size: "1",
    });
    const page = await backendGet<BackendPage<BackendTalentPoolEntry>>(
      `/talent/talent-pool?${qs.toString()}`,
    );
    return NextResponse.json({
      inPool: page.total > 0,
      entryId: page.items[0]?.id ?? null,
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
