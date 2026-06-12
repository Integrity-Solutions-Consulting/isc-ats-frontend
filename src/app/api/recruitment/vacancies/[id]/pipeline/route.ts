import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendGet } from "@/lib/backendFetch";
import type { VacancyPipeline } from "@/features/pipeline/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await backendGet<VacancyPipeline>(
      `/recruitment/vacancies/${id}/pipeline`,
    );
    return NextResponse.json(data);
  } catch (error) {
    // Return an empty pipeline so the UI doesn't crash on vacancies with no data
    const empty: VacancyPipeline = {
      stages: [],
      cards: [],
      rejectionSummary: { total: 0, reasons: [] },
    };
    return NextResponse.json(empty);
  }
}
