import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet } from "@/lib/backendFetch";
import { getAppliedVacancyIds } from "../getAppliedVacancyIds";

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

const WORK_MODE_MAP: Record<string, "remote" | "onsite" | "hybrid"> = {
  remoto: "remote", hibrido: "hybrid", presencial: "onsite",
};
const WORK_MODE_ES: Record<string, string> = {
  remoto: "remoto", hibrido: "híbrido", presencial: "presencial",
};
const LEVEL_LABEL: Record<string, string> = {
  junior: "Junior", semi_senior: "Semi Senior", senior: "Senior", especialista: "Especialista",
};

function mapVacancy(v: BackendVacancyItem, appliedIds: Set<number>) {
  const reqs = v.profile_requirements ?? {};
  // Full searchable set — the card only ever renders knowledge + tools as
  // pills (see VacancyCard), but the search bar must still match on skills
  // and certifications even though they aren't shown.
  const allSkills = [
    ...(reqs.knowledge ?? []),
    ...(reqs.tools ?? []),
    ...(reqs.skills ?? []),
    ...(reqs.certifications ?? []),
  ];
  const durYears = v.project_duration_years ?? 0;
  const durMonths = v.project_duration_months ?? 0;
  const totalMonths = durYears * 12 + durMonths;
  const durationLabel = durYears || durMonths
    ? [durYears ? `${durYears} año${durYears !== 1 ? "s" : ""}` : "", durMonths ? `${durMonths} mes${durMonths !== 1 ? "es" : ""}` : ""].filter(Boolean).join(" ")
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
    requirements: { knowledge: reqs.knowledge ?? [], tools: reqs.tools ?? [], skills: reqs.skills ?? [], certifications: reqs.certifications ?? [] },
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
    applicationStatus: appliedIds.has(v.id) ? ("applied" as const) : ("none" as const),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Public single-vacancy endpoint: candidate-safe, active vacancies only.
    const [item, appliedIds] = await Promise.all([
      backendGet<BackendVacancyItem>(`/recruitment/vacancies/public/${id}`),
      getAppliedVacancyIds(),
    ]);
    if (!item) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(mapVacancy(item, appliedIds));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
