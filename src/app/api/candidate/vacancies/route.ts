import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backendFetch";
import type { CandidateVacancy } from "@/features/candidate-portal/types";
import { getAppliedVacancyIds } from "./getAppliedVacancyIds";

interface BackendPage<T> { items: T[]; total: number; }

// Public-safe vacancy shape: no client_company, no staff/pipeline data. The
// candidate portal must never expose which client a vacancy belongs to.
interface BackendVacancyItem {
  id: number;
  vacancy_name: string;
  city: string;
  work_mode: string;
  resource_level: string;
  openings: number;
  experience_years: number;
  work_schedule: string | null;
  project_duration_years: number;
  project_duration_months: number;
  description: string | null;
  profile_requirements: Record<string, string[]> | null;
  career: string;
  created_at: string;
  updated_at: string | null;
}

const WORK_MODE_MAP: Record<string, CandidateVacancy["workMode"]> = {
  remoto: "remote",
  hibrido: "hybrid",
  presencial: "onsite",
};

const WORK_MODE_ES: Record<string, string> = {
  remoto: "remoto",
  hibrido: "híbrido",
  presencial: "presencial",
};

const LEVEL_LABEL: Record<string, string> = {
  junior: "Junior",
  semi_senior: "Semi Senior",
  senior: "Senior",
  especialista: "Especialista",
};

function mapVacancy(v: BackendVacancyItem, appliedIds: Set<number>): CandidateVacancy {
  const reqs = v.profile_requirements ?? {};
  // Cards show only "conocimientos" (knowledge items) as tags
  const allSkills = (reqs.knowledge ?? []).slice(0, 8);

  const durYears = v.project_duration_years ?? 0;
  const durMonths = v.project_duration_months ?? 0;
  const totalMonths = durYears * 12 + durMonths;

  const durationLabel =
    durYears || durMonths
      ? [
          durYears ? `${durYears} año${durYears !== 1 ? "s" : ""}` : "",
          durMonths ? `${durMonths} mes${durMonths !== 1 ? "es" : ""}` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "Indefinido";

  const levelLabel = LEVEL_LABEL[v.resource_level] ?? v.resource_level;

  return {
    id: String(v.id),
    title: v.vacancy_name,
    workMode: WORK_MODE_MAP[v.work_mode] ?? "onsite",
    level: levelLabel,
    experienceYears: v.experience_years ?? 0,
    city: v.city,
    durationMonths: totalMonths || null,
    skills: allSkills,
    description: v.description ?? "",
    requirements: {
      knowledge: reqs.knowledge ?? [],
      tools: reqs.tools ?? [],
      skills: reqs.skills ?? [],
      certifications: reqs.certifications ?? [],
    },
    conditions: {
      duration: durationLabel,
      city: `${v.city} (${WORK_MODE_ES[v.work_mode] ?? v.work_mode})`,
      schedule: v.work_schedule ?? "—",
      education: v.career ?? "",
      level: `${levelLabel}${v.experience_years ? ` (${v.experience_years}+ años)` : ""}`,
      openings: v.openings,
    },
    // "active" status is reached via an update (TH publishing a solicitud),
    // not the original creation — updated_at reflects that moment.
    publishedAt: v.updated_at ?? v.created_at,
    closingDaysLeft: null,
    applicationStatus: appliedIds.has(v.id) ? "applied" : "none",
  };
}

export async function GET() {
  try {
    // Public endpoint: candidate-safe (no client_company) and already filtered
    // to active, published vacancies server-side — no client-side filter needed.
    const [vacanciesData, appliedIds] = await Promise.all([
      backendGet<BackendPage<BackendVacancyItem>>(
        "/recruitment/vacancies/public?size=100",
      ),
      getAppliedVacancyIds(),
    ]);

    return NextResponse.json(vacanciesData.items.map((v) => mapVacancy(v, appliedIds)));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
