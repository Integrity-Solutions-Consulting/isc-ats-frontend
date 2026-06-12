export type VacancyStatus = "active" | "draft" | "closed";
// WorkMode and SeniorityLevel are backed by editable catalogs (org.parameters
// types work_mode / resource_level), so they are open strings — staff can add
// new codes from Configuración → Catálogos without breaking the form or types.
// The constants in labels.ts hold pretty labels for the seeded base codes and
// fall back to the raw code for anything added later.
export type WorkMode = string;
export type SeniorityLevel = string;

/** The four profile tag-boxes of P2 (recruitment.vacancies.profile_requirements jsonb). */
export interface ProfileRequirements {
  knowledge: string[];
  tools: string[];
  skills: string[];
  certifications: string[];
}

export interface Vacancy {
  id: string;
  position: string;
  /** Optional qualifier shown next to the position, e.g. "Angular · .NET 8". */
  positionDetail?: string;
  // Display names (for detail view)
  clientCompany: string;
  contact: string;
  department: string;
  city: string;
  career: string;
  process: string;
  // IDs (for edit form selects — populated by the detail endpoint, optional elsewhere)
  clientCompanyId?: string;
  contactId?: string;
  departmentId?: string;
  cityId?: string;
  careerId?: string;
  processId?: string;
  profileTemplateId?: string;
  workMode: WorkMode;
  level: SeniorityLevel;
  openings: number;
  experienceYears: number;
  workSchedule: string;
  durationYears: number | null;
  durationMonths: number | null;
  status: VacancyStatus;
  isActive: boolean;
  requirements: ProfileRequirements;
  description: string;
}

/** Subset of fields editable in the P2 form. */
export interface VacancyFormValues {
  position: string;
  clientCompany: string;
  contact: string;
  department: string;
  city: string;
  workMode: WorkMode;
  durationYears: number | null;
  durationMonths: number | null;
  career: string;
  process: string;
  level: SeniorityLevel;
  openings: number;
  experienceYears: number;
  workSchedule: string;
  requirements: ProfileRequirements;
  description: string;
}

export interface VacancyFilters {
  search: string;
  clientCompany: string | null;
  department: string | null;
  status: VacancyStatus | null;
  level: SeniorityLevel | null;
  isActiveFilter: "active" | "inactive" | "all";
}

export interface CatalogOption {
  id: string;
  label: string;
}

export interface ProfileTemplate {
  id: string;
  name: string;
  clientCompanyId: string;
  /** null = applies to all departments of that client */
  departmentId: string | null;
  requirements: ProfileRequirements;
}
