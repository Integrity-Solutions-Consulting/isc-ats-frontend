import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendGet } from "@/lib/backendFetch";
import type { OtherApplication } from "@/features/candidates/types";

interface BackendApplication {
  id: number;
  vacancy_id: number;
  candidate_id: number;
  status_id: number;
  current_stage_id: number | null;
  is_active: boolean;
}
interface BackendVacancyItem {
  id: number;
  vacancy_name: string;
  client_company: string;
}
interface BackendParam { id: number; name: string; }
interface BackendPage<T> { items: T[]; total: number; }

async function getAllPages<T>(path: string): Promise<BackendPage<T>> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const result = await backendGet<BackendPage<T>>(`${path}&page=${page}`);
    items.push(...result.items);
    if (items.length >= result.total) return { items, total: result.total };
    if (!result.items.length) throw new Error("No se pudieron cargar todas las postulaciones.");
  }
}

// GET /api/recruitment/applications?candidate_id=123
// Lists every application a candidate has, resolved with vacancy + status labels.
// Used by the "Otras postulaciones" card on the candidate profile.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get("candidate_id");
  if (!candidateId) return NextResponse.json([]);

  try {
    const [appsPage, vacanciesPage, statusesPage] = await Promise.all([
      getAllPages<BackendApplication>(
        `/recruitment/applications?candidate_id=${candidateId}&size=100`,
      ),
      getAllPages<BackendVacancyItem>(
        "/recruitment/vacancies/expanded?size=100&include_inactive=true",
      ),
      backendGet<BackendPage<BackendParam>>("/org/parameters?type=application_status&size=50"),
    ]);

    const vacancyMap = new Map(vacanciesPage.items.map((v) => [v.id, v]));
    const statusMap = new Map(statusesPage.items.map((s) => [s.id, s.name]));

    const result: OtherApplication[] = appsPage.items.map((app) => {
      const vacancy = vacancyMap.get(app.vacancy_id);
      const statusLabel =
        app.current_stage_id === null
          ? "Rechazado"
          : statusMap.get(app.status_id) ?? "En proceso";
      return {
        applicationId: String(app.id),
        vacancyId: String(app.vacancy_id),
        vacancyTitle: vacancy?.vacancy_name ?? "Vacante",
        companyName: vacancy?.client_company ?? "",
        statusLabel,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
