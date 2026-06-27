import { NextResponse } from "next/server";

const BASE = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface BackendPublicVacancyItem {
  id: number;
  vacancy_name: string;
  career: string;
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
  created_at: string;
}

interface BackendPage<T> {
  items: T[];
  total: number;
}

const WORK_MODE_MAP: Record<string, "remote" | "onsite" | "hybrid"> = {
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

function mapVacancy(v: BackendPublicVacancyItem) {
  const reqs = v.profile_requirements ?? {};
  const allSkills = [
    ...(reqs.skills ?? []),
    ...(reqs.tools ?? []),
    ...(reqs.knowledge ?? []),
  ].slice(0, 5);

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
    publishedAt: v.created_at,
    closingDaysLeft: null,
    applicationStatus: "none" as const,
  };
}

export async function GET() {
  try {
    const res = await fetch(
      `${BASE}/recruitment/vacancies/public?size=100`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }

    const data = await res.json() as BackendPage<BackendPublicVacancyItem>;
    return NextResponse.json(data.items.map(mapVacancy));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
