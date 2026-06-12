import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { backendGet, backendPost } from "@/lib/backendFetch";
import { decodeUserId } from "@/lib/decodeUserId";
import type { CandidateApplication, VacancyStage } from "@/features/candidate-portal/types";

interface BackendPage<T> { items: T[]; total: number; }

interface BackendApplication {
  id: number;
  vacancy_id: number;
  candidate_id: number;
  status_id: number;
  current_stage_id: number | null;
  match_score: number | null;
  applied_at: string;
  is_active: boolean;
}

interface BackendCandidateExpanded {
  id: number;
  user_id: number;
}

/** Only safe fields — no client_company, no contact. */
interface BackendVacancyItem {
  id: number;
  vacancy_name: string;
}

export async function GET() {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) return NextResponse.json([], { status: 401 });

    const userId = decodeUserId(token);
    if (!userId) return NextResponse.json([]);

    // Resolve user → candidate
    const candidates = await backendGet<{ items: BackendCandidateExpanded[] }>(
      `/recruitment/candidates/expanded?user_id=${userId}`,
    );
    const candidate = candidates.items[0];
    if (!candidate) return NextResponse.json([]);

    // Get applications for this candidate
    const appsData = await backendGet<BackendPage<BackendApplication>>(
      `/recruitment/applications?candidate_id=${candidate.id}&size=100`,
    );
    if (!appsData.items.length) return NextResponse.json([]);

    // Batch-fetch unique vacancy names (no client data)
    const vacancyIds = [...new Set(appsData.items.map((a) => a.vacancy_id))];
    const vacanciesData = await backendGet<BackendPage<BackendVacancyItem>>(
      `/recruitment/vacancies/expanded?size=100`,
    );
    const vacancyMap = new Map(vacanciesData.items.map((v) => [v.id, v]));

    // Fetch process stages per unique vacancy (parallel)
    const stagesMap = new Map<number, VacancyStage[]>();
    await Promise.all(
      vacancyIds.map(async (vid) => {
        try {
          const stages = await backendGet<VacancyStage[]>(
            `/recruitment/vacancies/${vid}/stages`,
          );
          stagesMap.set(vid, stages);
        } catch {
          stagesMap.set(vid, []);
        }
      }),
    );

    const result: CandidateApplication[] = appsData.items.map((app) => {
      const vacancy = vacancyMap.get(app.vacancy_id);
      const daysAgo = Math.floor((Date.now() - new Date(app.applied_at).getTime()) / 86_400_000);
      const lastUpdate = daysAgo === 0 ? "hoy" : daysAgo === 1 ? "hace 1 día" : `hace ${daysAgo} días`;
      const stages = stagesMap.get(app.vacancy_id) ?? [];

      return {
        id: String(app.id),
        vacancyId: String(app.vacancy_id),
        vacancyTitle: vacancy?.vacancy_name ?? `Vacante #${app.vacancy_id}`,
        appliedAt: app.applied_at.slice(0, 10),
        lastUpdate,
        status: "reviewing" as const,
        stages,
        currentStageId: app.current_stage_id,
        salaryExpectation: 0,
        slotStatus: null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const userId = decodeUserId(token);
    if (!userId) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const body = (await request.json()) as { vacancyId: string; salaryExpectation: number };

    // Resolve user → candidate
    const candidates = await backendGet<{ items: BackendCandidateExpanded[] }>(
      `/recruitment/candidates/expanded?user_id=${userId}`,
    );
    const candidate = candidates.items[0];
    if (!candidate) return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });

    // Get active application status id
    interface BackendParamPage { items: { id: number; code: string }[]; }
    const statuses = await backendGet<BackendParamPage>("/org/parameters?type=application_status&size=10");
    const activeStatus = statuses.items.find((s) => s.code === "active");
    if (!activeStatus) return NextResponse.json({ error: "Estado de aplicación no encontrado" }, { status: 500 });

    const created = await backendPost("/recruitment/applications", {
      vacancy_id: Number(body.vacancyId),
      candidate_id: candidate.id,
      status_id: activeStatus.id,
      salary_expectation: body.salaryExpectation || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
