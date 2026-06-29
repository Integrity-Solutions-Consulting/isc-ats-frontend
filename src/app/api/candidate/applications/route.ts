import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { backendGet, backendPost } from "@/lib/backendFetch";
import { decodeUserId } from "@/lib/decodeUserId";
import type {
  CandidateApplication,
  InterviewOffer,
  VacancyStage,
} from "@/features/candidate-portal/types";
import { deriveCandidateStatus } from "./deriveCandidateStatus";

interface BackendPage<T> { items: T[]; total: number; }

/** Subset of the backend InterviewRead we need for the candidate offer picker. */
interface BackendInterviewOffer {
  id: number;
  application_id: number;
  offered_slots: { start: string; end: string }[] | null;
  token_expires_at: string | null;
}

/** Subset of the backend InterviewRead for an already-scheduled interview. */
interface BackendScheduledInterview {
  id: number;
  application_id: number;
  scheduled_at: string | null;
  ends_at: string | null;
  teams_meeting_url: string | null;
}

// Ecuador is a fixed UTC-5; format scheduled interviews in its wall-clock time.
const EC_DATE_FMT = new Intl.DateTimeFormat("es-EC", {
  timeZone: "America/Guayaquil",
  weekday: "short",
  day: "numeric",
  month: "short",
});
const EC_TIME_FMT = new Intl.DateTimeFormat("es-EC", {
  timeZone: "America/Guayaquil",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatScheduledInterview(
  i: BackendScheduledInterview,
): { date: string; time: string; platform: string } {
  const start = new Date(i.scheduled_at as string);
  let time = EC_TIME_FMT.format(start);
  if (i.ends_at) time += `–${EC_TIME_FMT.format(new Date(i.ends_at))}`;
  return {
    date: EC_DATE_FMT.format(start),
    time,
    platform: i.teams_meeting_url ? "Microsoft Teams" : "Entrevista agendada",
  };
}

interface BackendApplication {
  id: number;
  vacancy_id: number;
  candidate_id: number;
  status_id: number;
  current_stage_id: number | null;
  rejected_at_stage_id: number | null;
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

    // Fetch application_status catalog to resolve status codes (reuse same pattern as POST)
    interface BackendParamPage { items: { id: number; code: string }[]; }
    const appStatuses = await backendGet<BackendParamPage>("/org/parameters?type=application_status&size=10");
    const statusCodeById = new Map<number, string>(appStatuses.items.map((s) => [s.id, s.code]));

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

    // Open offers (Mode B) and scheduled interviews for this candidate, keyed by
    // application. Best-effort: a failure here must never break the list.
    const offerByApp = new Map<number, InterviewOffer>();
    const interviewByApp = new Map<number, CandidateApplication["interview"]>();
    const [offersRes, scheduledRes] = await Promise.allSettled([
      backendGet<BackendInterviewOffer[]>("/interviews/me/offers"),
      backendGet<BackendScheduledInterview[]>("/interviews/me/scheduled"),
    ]);
    if (offersRes.status === "fulfilled") {
      for (const o of offersRes.value) {
        offerByApp.set(o.application_id, {
          interviewId: o.id,
          slots: (o.offered_slots ?? []).map((s) => ({ start: s.start, end: s.end })),
          expiresAt: o.token_expires_at ?? null,
        });
      }
    }
    if (scheduledRes.status === "fulfilled") {
      for (const i of scheduledRes.value) {
        if (!i.scheduled_at) continue;
        interviewByApp.set(i.application_id, formatScheduledInterview(i));
      }
    }

    const result: CandidateApplication[] = appsData.items.map((app) => {
      const vacancy = vacancyMap.get(app.vacancy_id);
      const daysAgo = Math.floor((Date.now() - new Date(app.applied_at).getTime()) / 86_400_000);
      const lastUpdate = daysAgo === 0 ? "hoy" : daysAgo === 1 ? "hace 1 día" : `hace ${daysAgo} días`;
      const stages = stagesMap.get(app.vacancy_id) ?? [];
      const offer = offerByApp.get(app.id);
      const interview = interviewByApp.get(app.id);

      return {
        id: String(app.id),
        vacancyId: String(app.vacancy_id),
        vacancyTitle: vacancy?.vacancy_name ?? `Vacante #${app.vacancy_id}`,
        appliedAt: app.applied_at.slice(0, 10),
        lastUpdate,
        status: deriveCandidateStatus(app.status_id, app.current_stage_id, stages, statusCodeById),
        stages,
        currentStageId: app.current_stage_id,
        rejectedAtStageId: app.rejected_at_stage_id,
        salaryExpectation: 0,
        slotStatus: offer
          ? ("pending_selection" as const)
          : interview
            ? ("confirmed" as const)
            : null,
        offer,
        interview,
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
