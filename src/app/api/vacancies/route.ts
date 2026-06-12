import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { backendGet, backendPost } from "@/lib/backendFetch";
import type { Vacancy } from "@/features/vacancies/types";

interface BackendVacancyItem {
  id: number;
  vacancy_name: string;
  client_company: string;
  contact: string;
  department: string;
  process: string;
  career: string;
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
  created_at: string;
}

interface BackendPage<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

interface BackendParam {
  id: number;
  type: string;
  code: string;
  name: string;
}

function mapVacancy(v: BackendVacancyItem): Vacancy {
  const reqs = v.profile_requirements;
  return {
    id: String(v.id),
    position: v.vacancy_name,
    clientCompany: v.client_company,
    contact: v.contact,
    department: v.department,
    city: v.city,
    workMode: (v.work_mode as Vacancy["workMode"]) ?? "onsite",
    level: (v.resource_level as Vacancy["level"]) ?? "junior",
    openings: v.openings,
    experienceYears: v.experience_years,
    workSchedule: v.work_schedule ?? "",
    durationYears: v.project_duration_years || null,
    durationMonths: v.project_duration_months || null,
    status: (v.vacancy_status as Vacancy["status"]) ?? "draft",
    isActive: v.is_active,
    career: v.career,
    process: v.process,
    requirements: {
      knowledge: reqs?.knowledge ?? [],
      tools: reqs?.tools ?? [],
      skills: reqs?.skills ?? [],
      certifications: reqs?.certifications ?? [],
    },
    description: v.description ?? "",
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function resolveReferences(
  position: string,
  workMode: string,
  level: string,
  status: string,
) {
  const [namesData, workModesData, levelsData, statusesData] = await Promise.all([
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=vacancy_name&size=100"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=work_mode&size=10"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=resource_level&size=10"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=vacancy_status&size=10"),
  ]);

  let vacancyNameParam = namesData.items.find(
    (p) => p.name.toLowerCase() === position.trim().toLowerCase()
  );
  if (!vacancyNameParam) {
    vacancyNameParam = await backendPost<BackendParam>("/org/parameters", {
      type: "vacancy_name",
      code: slugify(position),
      name: position.trim(),
    });
  }

  const workModeParam = workModesData.items.find((p) => p.code === workMode);
  if (!workModeParam) {
    throw new Error(`Work mode parameter not found for code: ${workMode}`);
  }

  const levelParam = levelsData.items.find((p) => p.code === level);
  if (!levelParam) {
    throw new Error(`Resource level parameter not found for code: ${level}`);
  }

  const statusParam = statusesData.items.find((p) => p.code === status);
  if (!statusParam) {
    throw new Error(`Vacancy status parameter not found for code: ${status}`);
  }

  return {
    vacancy_name_id: vacancyNameParam.id,
    work_mode_id: workModeParam.id,
    resource_level_id: levelParam.id,
    status_id: statusParam.id,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "1";
    const size = searchParams.get("size") ?? "50";

    const data = await backendGet<BackendPage<BackendVacancyItem>>(
      `/recruitment/vacancies/expanded?page=${page}&size=${size}&include_inactive=true`,
    );

    return NextResponse.json(data.items.map(mapVacancy));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      values: any;
      status: "draft" | "active" | "paused" | "closed";
    };
    const { values, status } = body;

    const refs = await resolveReferences(
      values.position,
      values.workMode,
      values.level,
      status,
    );

    const payload = {
      vacancy_name_id: refs.vacancy_name_id,
      client_company_id: Number(values.clientCompany),
      contact_id: Number(values.contact),
      department_id: Number(values.department),
      process_id: Number(values.process),
      career_id: Number(values.career),
      city_id: Number(values.city),
      work_mode_id: refs.work_mode_id,
      resource_level_id: refs.resource_level_id,
      status_id: refs.status_id,
      openings: values.openings,
      experience_years: values.experienceYears,
      work_schedule: values.workSchedule || null,
      project_duration_years: values.durationYears ?? 0,
      project_duration_months: values.durationMonths ?? 0,
      description: values.description || null,
      profile_requirements: values.requirements || {
        knowledge: [],
        tools: [],
        skills: [],
        certifications: [],
      },
    };

    const created = await backendPost<BackendVacancyItem>("/recruitment/vacancies", payload);
    return NextResponse.json(mapVacancy(created), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
