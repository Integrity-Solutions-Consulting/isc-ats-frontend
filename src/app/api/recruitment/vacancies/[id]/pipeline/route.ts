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
    console.error(`[pipeline] vacancy ${id} failed:`, error);
    return NextResponse.json(
      { error: String(error) },
      { status: 502 },
    );
  }
}
