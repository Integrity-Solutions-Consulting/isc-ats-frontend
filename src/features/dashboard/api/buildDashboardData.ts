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
  scheduled_at: string;
  teams_meeting_url: string | null;
}

const DEFAULT_STAGES = [
  { name: "CV recibido", color: "bg-primary-200" },
  { name: "Llamada de validación", color: "bg-primary-300" },
  { name: "Prueba técnica", color: "bg-primary-400" },
  { name: "Entrevista cliente", color: "bg-primary-500" },
  { name: "Contratados", color: "bg-primary-700" },
];

export async function buildDashboardData(): Promise<DashboardData> {
  const [vacanciesPage, interviewsPage] = await Promise.all([
    backendGet<BackendPage<BackendVacancyItem>>("/recruitment/vacancies/expanded?size=100"),
    backendGet<BackendPage<BackendInterview>>("/recruitment/interviews?size=100"),
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

  const totalApplicants = pipelines.reduce((sum, p) => sum + p.cards.length, 0);

  const hiredCards = pipelines.flatMap((p) => {
    const finalStages = new Set(p.stages.filter((s) => s.type === "final").map((s) => s.id));
    return p.cards.filter((c) => finalStages.has(c.stageId));
  });

  const kpis = [
    { label: "Vacantes activas", value: activeVacancies.length, trend: 1, trendUp: true },
    { label: "En evaluación activa", value: totalApplicants, trend: 5, trendUp: true },
    { label: "Entrevistas programadas", value: interviewsPage.items.length, trend: 2, trendUp: true },
    { label: "Contratados", value: hiredCards.length, trend: 1, trendUp: true },
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

  const allCardsMap = new Map(pipelines.flatMap((p) => p.cards).map((c) => [c.id, c]));
  const vacanciesMap = new Map(vacanciesPage.items.map((v) => [String(v.id), v]));

  const upcomingInterviews = interviewsPage.items
    .map((int) => {
      const card = allCardsMap.get(String(int.application_id));
      const vacancy = card ? vacanciesMap.get(card.vacancyId) : null;

      const date = new Date(int.scheduled_at);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      let day: "today" | "tomorrow" | string = date.toLocaleDateString("es-EC", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      if (date.toDateString() === today.toDateString()) {
        day = "today";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        day = "tomorrow";
      }

      const time = date.toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return {
        id: `int-${int.id}`,
        candidateName: card?.candidateName ?? "Candidato",
        candidateInitials: card?.initials ?? "C",
        avatarColor: card?.avatarColor ?? "bg-primary-500",
        position: vacancy?.vacancy_name ?? "Cargo",
        clientCompany: vacancy?.client_company ?? "Cliente",
        time,
        day,
      };
    })
    .filter((i): i is typeof i & { day: "today" | "tomorrow" } =>
      i.day === "today" || i.day === "tomorrow"
    )
    .slice(0, 10);

  const topCandidates = pipelines
    .flatMap((p) => {
      const vacancy = vacanciesMap.get(p.vacancyId);
      return p.cards.map((c) => ({
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
