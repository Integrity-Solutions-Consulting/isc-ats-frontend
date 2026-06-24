import type {
  SeniorityLevel,
  VacancyStatus,
  WorkMode,
} from "./types";
import type { BadgeProps } from "@/design-system/ui/badge";

export const STATUS_LABEL: Record<VacancyStatus, string> = {
  active: "Publicada",
  draft: "Borrador",
  closed: "Cerrada",
  cancelled: "Cancelada",
};

export const STATUS_BADGE_VARIANT: Record<
  VacancyStatus,
  NonNullable<BadgeProps["variant"]>
> = {
  active: "success",
  draft: "neutral",
  closed: "neutral",
  cancelled: "warning",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
  project: "Por proyecto",
};

export const LEVEL_LABEL: Record<SeniorityLevel, string> = {
  junior: "Junior",
  semi_senior: "Semi Senior",
  senior: "Senior",
  specialist: "Especialista",
};

export const LEVEL_HINT: Record<SeniorityLevel, string> = {
  junior: "0–2 años",
  semi_senior: "2–4 años",
  senior: "4–7 años",
  specialist: "7+ años · líder técnico",
};

export const LEVEL_ORDER: SeniorityLevel[] = [
  "junior",
  "semi_senior",
  "senior",
  "specialist",
];

/** Format a project duration into Spanish, e.g. "1 año 6 meses" or "—". */
export function formatDuration(
  years: number | null,
  months: number | null,
): string {
  const parts: string[] = [];
  if (years && years > 0) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (months && months > 0)
    parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  return parts.length > 0 ? parts.join(" ") : "—";
}
