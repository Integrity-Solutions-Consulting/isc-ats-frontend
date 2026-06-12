import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backendFetch";
import type { CandidateVacancy } from "@/features/candidate-portal/types";

interface BackendPage<T> { items: T[]; total: number; }

interface BackendVacancyItem {
  id: number;
  vacancy_name: string;
  client_company: string;
  city: string;
  work_mode: string;
  resource_level: string;
  vacancy_status: string;
  openings: number;
  experience_years: number;
  work_schedule: string | null;
  project_duration_years: number;
  project_duration_months: number;
  description: string | null;
  profile_requirements: Record<string, string[]> | null;
  is_active: boolean;
  career: string;
  created_at: string;
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

function mapVacancy(v: BackendVacancyItem): CandidateVacancy {
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
  const daysAgo = Math.floor(
    (Date.now() - new Date(v.created_at).getTime()) / 86_400_000,
  );

  const initials = v.client_company
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return {
    id: String(v.id),
    title: v.vacancy_name,
    clientName: v.client_company,
    clientInitials: initials,
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
    publishedDaysAgo: daysAgo,
    closingDaysLeft: null,
    applicationStatus: "none",
  };
}

export async function GET() {
  try {
    const vacanciesData = await backendGet<BackendPage<BackendVacancyItem>>(
      "/recruitment/vacancies/expanded?size=100",
    );

    const active = vacanciesData.items.filter(
      (v) => v.is_active && v.vacancy_status === "active",
    );

    return NextResponse.json(active.map(mapVacancy));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
