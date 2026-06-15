import { backendGet, backendPost } from "@/lib/backendFetch";
import type { Vacancy } from "@/features/vacancies/types";

export interface BackendVacancyItem {
  id: number;
  vacancy_name: string;
  client_company: string;
  contact_id: number;
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
  profile_template_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface BackendPage<T> { items: T[]; total: number; }
export interface BackendParam { id: number; type: string; code: string; name: string; }
interface BackendCompany { id: number; name: string; }
interface BackendContact { id: number; first_name: string; last_name: string; }
interface BackendDept { id: number; name: string; }
interface BackendProcess { id: number; name: string; }

export interface CatalogMaps {
  companyNameToId: Map<string, string>;
  contactNameToId: Map<string, string>;
  deptNameToId: Map<string, string>;
  cityNameToId: Map<string, string>;
  careerNameToId: Map<string, string>;
  processNameToId: Map<string, string>;
}

export function mapVacancy(v: BackendVacancyItem, catalogs?: CatalogMaps): Vacancy {
  const reqs = v.profile_requirements;
  return {
    id: String(v.id),
    position: v.vacancy_name,
    clientCompany: v.client_company,
    contact: v.contact,
    department: v.department,
    city: v.city,
    career: v.career,
    process: v.process,
    clientCompanyId: catalogs?.companyNameToId.get(v.client_company) ?? "",
    contactId: String(v.contact_id),
    departmentId: catalogs?.deptNameToId.get(v.department) ?? "",
    cityId: catalogs?.cityNameToId.get(v.city) ?? "",
    careerId: catalogs?.careerNameToId.get(v.career) ?? "",
    processId: catalogs?.processNameToId.get(v.process) ?? "",
    profileTemplateId: v.profile_template_id ? String(v.profile_template_id) : "",
    workMode: (v.work_mode as Vacancy["workMode"]) ?? "onsite",
    level: (v.resource_level as Vacancy["level"]) ?? "junior",
    openings: v.openings,
    experienceYears: v.experience_years,
    workSchedule: v.work_schedule ?? "",
    durationYears: v.project_duration_years || null,
    durationMonths: v.project_duration_months || null,
    status: (v.vacancy_status as Vacancy["status"]) ?? "draft",
    isActive: v.is_active,
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
  return text.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function resolveReferences(position: string, workMode: string, level: string, status: string) {
  const [namesData, workModesData, levelsData, statusesData] = await Promise.all([
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=vacancy_name&size=100"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=work_mode&size=10"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=resource_level&size=10"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=vacancy_status&size=10"),
  ]);

  let vacancyNameParam = namesData.items.find((p) => p.name.toLowerCase() === position.trim().toLowerCase());
  if (!vacancyNameParam) {
    vacancyNameParam = await backendPost<BackendParam>("/org/parameters", {
      type: "vacancy_name", code: slugify(position), name: position.trim(),
    });
  }

  const workModeParam = workModesData.items.find((p) => p.code === workMode);
  if (!workModeParam) throw new Error(`Work mode not found: ${workMode}`);

  const levelParam = levelsData.items.find((p) => p.code === level);
  if (!levelParam) throw new Error(`Resource level not found: ${level}`);

  const statusParam = statusesData.items.find((p) => p.code === status);
  if (!statusParam) throw new Error(`Vacancy status not found: ${status}`);

  return {
    vacancy_name_id: vacancyNameParam.id,
    work_mode_id: workModeParam.id,
    resource_level_id: levelParam.id,
    status_id: statusParam.id,
  };
}

export async function buildCatalogMaps(): Promise<CatalogMaps> {
  const [companies, contacts, departments, processes, cities, careers] = await Promise.all([
    backendGet<BackendPage<BackendCompany>>("/org/client-companies?size=100"),
    backendGet<BackendPage<BackendContact>>("/org/contacts?size=100"),
    backendGet<BackendPage<BackendDept>>("/org/departments?size=100"),
    backendGet<BackendPage<BackendProcess>>("/org/processes?size=100"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=city&size=100"),
    backendGet<BackendPage<BackendParam>>("/org/parameters?type=career&size=100"),
  ]);
  return {
    companyNameToId: new Map(companies.items.map((c) => [c.name, String(c.id)])),
    contactNameToId: new Map(contacts.items.map((c) => [`${c.first_name} ${c.last_name}`, String(c.id)])),
    deptNameToId: new Map(departments.items.map((d) => [d.name, String(d.id)])),
    processNameToId: new Map(processes.items.map((p) => [p.name, String(p.id)])),
    cityNameToId: new Map(cities.items.map((p) => [p.name, String(p.id)])),
    careerNameToId: new Map(careers.items.map((p) => [p.name, String(p.id)])),
  };
}
