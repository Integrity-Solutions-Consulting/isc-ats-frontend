import { backendGet } from "@/lib/backendFetch";
import type { DashboardData } from "../types";

interface BackendVacancyItem {
  id: number;
  vacancy_name: string;
  client_company: string;
  contact: string;
  department: string;
  vacancy_status: string;
  openings: number;
  experience_years: number;
  is_active: boolean;
}

interface BackendPage<T> {
  items: T[];
  total: number;
}

interface PipelineStage {
  id: string;
  name: string;
  type: "normal" | "final" | "rejected";
}

interface PipelineCard {
  id: string;
  candidateId: string;
  vacancyId: string;
  stageId: string;
  candidateName: string;
  initials: string;
  avatarColor: string;
  matchPercent: number | null;
  updatedAt: string;
}

interface Pipeline {
  stages: PipelineStage[];
  cards: PipelineCard[];
  rejectionSummary: { total: number };
}

interface BackendInterview {
  id: number;
  application_id: number;
  scheduled_at: string | null;
  cancellation_reason: string | null;
  teams_meeting_url: string | null;
}

/** GET /recruitment/interviews/agenda — server computes the Ecuador-local
 * today/tomorrow boundary and cross-owner visibility; the frontend just renders it. */
interface BackendAgendaInterview {
  id: number;
  scheduled_at: string;
  ends_at: string | null;
  candidate_name: string;
  vacancy_name: string;
  interviewer_email: string;
  teams_meeting_url: string | null;
  day: "today" | "tomorrow";
}

const AVATAR_COLORS = [
  "bg-primary-600",
  "bg-accent-500",
  "bg-primary-400",
  "bg-primary-700",
  "bg-accent-600",
  "bg-primary-300",
  "bg-accent-400",
];

function initialsFromName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Ecuador is a fixed UTC-5 (no DST) — always render agenda times in Ecuador
// wall-clock time, regardless of the viewer's own browser timezone.
const EC_TIME_FMT = new Intl.DateTimeFormat("es-EC", {
  timeZone: "America/Guayaquil",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DEFAULT_STAGES = [
  { name: "CV recibido", color: "bg-primary-200" },
  { name: "Llamada de validación", color: "bg-primary-300" },
  { name: "Prueba técnica", color: "bg-primary-400" },
  { name: "Entrevista cliente", color: "bg-primary-500" },
  { name: "Contratados", color: "bg-primary-700" },
];

export async function buildDashboardData(): Promise<DashboardData> {
  const [vacanciesPage, interviewsPage, agenda] = await Promise.all([
    backendGet<BackendPage<BackendVacancyItem>>("/recruitment/vacancies/expanded?size=100"),
    backendGet<BackendPage<BackendInterview>>("/recruitment/interviews?size=100"),
    // R5/R6: server-side Ecuador-local today/tomorrow boundary + Admin/TH gating
    // (recruitment.interviews.read_agenda). A 403 (caller lacks the permission)
    // or any other failure must not break the rest of the dashboard — the widget
    // is simply hidden (empty list), which also acts as defense-in-depth gating
    // on the frontend without needing new permission plumbing here.
    backendGet<BackendAgendaInterview[]>("/recruitment/interviews/agenda").catch(
      () => [] as BackendAgendaInterview[],
    ),
  ]);

  const activeVacancies = vacanciesPage.items.filter(
    (v) => v.is_active && v.vacancy_status === "active"
  );

  const pipelines = await Promise.all(
    activeVacancies.map(async (v) => {
      try {
        const pipe = await backendGet<Pipeline>(`/recruitment/vacancies/${v.id}/pipeline`);
        return { vacancyId: String(v.id), ...pipe };
      } catch {
        return { vacancyId: String(v.id), stages: [] as PipelineStage[], cards: [] as PipelineCard[], rejectionSummary: { total: 0 } };
      }
    })
  );

  // Terminal cards = in a final-positive stage (hired) or in the virtual
  // "rejected" stage. They are no longer in active evaluation and must not
  // surface as potential candidates.
  const finalStageIds = (p: { stages: PipelineStage[] }) =>
    new Set(p.stages.filter((s) => s.type === "final").map((s) => s.id));
  const isTerminal = (stageId: string, finals: Set<string>) =>
    stageId === "rejected" || finals.has(stageId);

  const activeApplicants = pipelines.reduce((sum, p) => {
    const finals = finalStageIds(p);
    return sum + p.cards.filter((c) => !isTerminal(c.stageId, finals)).length;
  }, 0);

  const hiredCards = pipelines.flatMap((p) => {
    const finals = finalStageIds(p);
    return p.cards.filter((c) => finals.has(c.stageId));
  });

  // Scheduled interviews = have a real date, are not cancelled, and are today or
  // later. Excludes Mode B offers (no date yet), cancelled and past interviews.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const scheduledInterviews = interviewsPage.items.filter(
    (int): int is BackendInterview & { scheduled_at: string } =>
      int.scheduled_at !== null &&
      !int.cancellation_reason &&
      new Date(int.scheduled_at) >= startOfToday
  );

  const kpis = [
    { label: "Vacantes activas", value: activeVacancies.length },
    { label: "En evaluación activa", value: activeApplicants },
    { label: "Entrevistas programadas", value: scheduledInterviews.length },
    { label: "Contratados", value: hiredCards.length },
  ];

  const stageCounts = new Map<string, number>();
  const stageColors = new Map<string, string>();
  DEFAULT_STAGES.forEach((s) => {
    stageCounts.set(s.name, 0);
    stageColors.set(s.name, s.color);
  });

  pipelines.forEach((p) => {
    const stageMap = new Map(p.stages.map((s) => [s.id, s.name]));
    p.cards.forEach((c) => {
      const name = stageMap.get(c.stageId);
      if (name) {
        stageCounts.set(name, (stageCounts.get(name) ?? 0) + 1);
      }
    });
  });

  const candidatesByStage = Array.from(stageCounts.entries()).map(([stageName, count]) => ({
    stageName,
    count,
    color: stageColors.get(stageName) ?? "bg-primary-300",
  }));

  const candidatesByVacancy: Record<string, Array<{ stageName: string; count: number; color: string }>> = {};
  pipelines.forEach((p) => {
    const stageMap = new Map(p.stages.map((s) => [s.id, s.name]));
    const localCounts = new Map<string, number>();
    DEFAULT_STAGES.forEach((s) => localCounts.set(s.name, 0));

    p.cards.forEach((c) => {
      const name = stageMap.get(c.stageId);
      if (name && localCounts.has(name)) {
        localCounts.set(name, localCounts.get(name)! + 1);
      }
    });

    candidatesByVacancy[p.vacancyId] = Array.from(localCounts.entries()).map(([stageName, count]) => ({
      stageName,
      count,
      color: stageColors.get(stageName) ?? "bg-primary-300",
    }));
  });

  const clientCounts = new Map<string, number>();
  vacanciesPage.items.forEach((v) => {
    if (v.is_active && v.vacancy_status === "active") {
      clientCounts.set(v.client_company, (clientCounts.get(v.client_company) ?? 0) + 1);
    }
  });
  const vacanciesByClient = Array.from(clientCounts.entries()).map(([clientName, count]) => ({
    clientName,
    count,
  }));

  const vacanciesMap = new Map(vacanciesPage.items.map((v) => [String(v.id), v]));

  // D5: the today/tomorrow bucket and the Ecuador-local boundary are computed
  // server-side by GET /interviews/agenda — no client-side Date() derivation,
  // and it is cross-owner (every interviewer's entries, not just the caller's).
  const upcomingInterviews = agenda
    .map((entry) => ({
      id: `agenda-${entry.id}`,
      candidateName: entry.candidate_name,
      candidateInitials: initialsFromName(entry.candidate_name),
      avatarColor: AVATAR_COLORS[entry.id % AVATAR_COLORS.length],
      position: entry.vacancy_name,
      time: EC_TIME_FMT.format(new Date(entry.scheduled_at)),
      day: entry.day,
    }))
    .slice(0, 10);

  const topCandidates = pipelines
    .flatMap((p) => {
      const vacancy = vacanciesMap.get(p.vacancyId);
      const finals = finalStageIds(p);
      return p.cards
        .filter((c) => !isTerminal(c.stageId, finals))
        .map((c) => ({
          candidateId: c.candidateId,
          applicationId: c.id,
          vacancyId: p.vacancyId,
          firstName: c.candidateName.split(" ")[0],
          lastName: c.candidateName.split(" ").slice(1).join(" "),
          initials: c.initials,
          avatarColor: c.avatarColor,
          matchPercent: Math.round(c.matchPercent ?? 0),
          position: vacancy?.vacancy_name ?? "Cargo",
          clientCompany: vacancy?.client_company ?? "Cliente",
          department: vacancy?.department ?? "Tecnología",
          daysAgo: 2,
        }));
    })
    .filter((c) => c.matchPercent >= 75)
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 5);

  return {
    kpis,
    vacancyOptions: activeVacancies.map((v) => ({
      id: String(v.id),
      label: `${v.vacancy_name} · ${v.client_company}`,
    })),
    candidatesByStage,
    candidatesByVacancy,
    vacanciesByClient,
    upcomingInterviews,
    topCandidates,
  };
}
