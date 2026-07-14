import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost, backendErrorResponse } from "@/lib/backendFetch";

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendVacancyPromoImage {
  id: number;
  vacancy_id: number;
  file_id: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vacancyId = searchParams.get("vacancy_id");

  if (!vacancyId) {
    return NextResponse.json({ error: "vacancy_id is required" }, { status: 400 });
  }

  try {
    const page = await backendGet<BackendPage<BackendVacancyPromoImage>>(
      `/ai/vacancy-promo-images?vacancy_id=${vacancyId}&size=50`,
    );
    return NextResponse.json(page.items);
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { vacancyId: string };
    const created = await backendPost<BackendVacancyPromoImage>(
      `/recruitment/vacancies/${body.vacancyId}/generate-poster`,
      {},
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
