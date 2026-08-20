import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { backendErrorResponse, backendGet, backendPost } from "@/lib/backendFetch";
import { decodeUserId } from "@/lib/decodeUserId";
import type {
  CandidateApplication,
  InterviewOffer,
  VacancyStage,
} from "@/features/candidate-portal/types";
import { deriveCandidateStatus } from "./deriveCandidateStatus";

interface BackendPage<T> { items: T[]; total: number; }

/**
 * Validated shape of the create-application request body. Guards against the
 * silent coercions the old `Number(body.vacancyId)` / `salaryExpectation || null`
 * path allowed: NaN vacancy ids, negative ids, and salaryExpectation 0 being
 * turned into null or negative/non-finite values reaching the backend.
 *
 * `salaryExpectation` is required, mirroring the backend's ApplicationCreate.
 * Rejecting it here turns what would be a raw 422 from FastAPI into the proxy's
 * own Spanish message. 0 stays valid — it is a declared answer.
 */
const createApplicationSchema = z.object({
  vacancyId: z.coerce.number().int().positive(),
  salaryExpectation: z.coerce.number().finite().nonnegative(),
});

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
  process_stage_id: number;
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
  rejection_reason: string | null;
  // Resolved by the backend regardless of the vacancy's current status (draft/
  // active/closed/paused) — see ApplicationService._attach_vacancy_names.
  // Only null when the vacancy itself was hard-deleted.
  vacancy_name: string | null;
  match_score: number | null;
  applied_at: string;
  is_active: boolean;
}

interface BackendCandidateExpanded {
  id: number;
  user_id: number;
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

    // Newest application first, so a candidate who just applied sees it at the
    // top of every tab (Todas/En proceso/Finalizadas) without having to scroll.
    appsData.items.sort(
      (a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime(),
    );

    // Fetch application_status catalog to resolve status codes (reuse same pattern as POST)
    interface BackendParamPage { items: { id: number; code: string }[]; }
    const appStatuses = await backendGet<BackendParamPage>("/org/parameters?type=application_status&size=10");
    const statusCodeById = new Map<number, string>(appStatuses.items.map((s) => [s.id, s.code]));

    // Vacancy names now come straight from each application record (backend
    // resolves them regardless of vacancy status — see BackendApplication above),
    // so no separate catalog lookup is needed here. Previously this cross-
    // referenced the candidate-safe PUBLIC endpoint, which only lists ACTIVE
    // vacancies — an application to a vacancy that later closed would drop out of
    // that list and permanently fall back to "Vacante no disponible" (BUG-24).
    const vacancyIds = [...new Set(appsData.items.map((a) => a.vacancy_id))];

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
    const scheduledByApp = new Map<number, BackendScheduledInterview>();
    const [offersRes, scheduledRes] = await Promise.allSettled([
      backendGet<BackendInterviewOffer[]>("/recruitment/interviews/me/offers"),
      backendGet<BackendScheduledInterview[]>("/recruitment/interviews/me/scheduled"),
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
        scheduledByApp.set(i.application_id, i);
      }
    }

    const result: CandidateApplication[] = appsData.items.map((app) => {
      const daysAgo = Math.floor((Date.now() - new Date(app.applied_at).getTime()) / 86_400_000);
      const lastUpdate = daysAgo === 0 ? "hoy" : daysAgo === 1 ? "hace 1 día" : `hace ${daysAgo} días`;
      const stages = stagesMap.get(app.vacancy_id) ?? [];
      const offer = offerByApp.get(app.id);
      // A scheduled interview only stays relevant while the candidate is still
      // on the stage it was booked for — HR may move them on/back without
      // formally cancelling the interview (e.g. skipped or deprioritized).
      const scheduled = scheduledByApp.get(app.id);
      const interview =
        scheduled && scheduled.process_stage_id === app.current_stage_id
          ? formatScheduledInterview(scheduled)
          : undefined;

      return {
        id: String(app.id),
        vacancyId: String(app.vacancy_id),
        vacancyTitle: app.vacancy_name ?? "Vacante no disponible",
        appliedAt: app.applied_at.slice(0, 10),
        lastUpdate,
        status: deriveCandidateStatus(app.status_id, app.current_stage_id, stages, statusCodeById),
        stages,
        currentStageId: app.current_stage_id,
        rejectedAtStageId: app.rejected_at_stage_id,
        rejectionReason: app.rejection_reason,
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
    return backendErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const store = await cookies();
    const token = store.get("access-token")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const userId = decodeUserId(token);
    if (!userId) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const raw = await request.json().catch(() => null);
    const parsed = createApplicationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de postulación inválidos" }, { status: 400 });
    }
    const body = parsed.data;

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
      vacancy_id: body.vacancyId,
      candidate_id: candidate.id,
      status_id: activeStatus.id,
      salary_expectation: body.salaryExpectation,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
