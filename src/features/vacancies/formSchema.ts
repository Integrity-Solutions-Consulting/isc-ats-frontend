import { z } from "zod";

import type { VacancyFormValues } from "./types";

const requirementsSchema = z.object({
  knowledge: z.array(z.string()),
  tools: z.array(z.string()),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
});

/**
 * Base form validation. The ONLY two fields that stay optional are the
 * profile template (a separate "load from template" shortcut, never a form
 * field of its own) and `process` — a solicitud (non-publisher save) has no
 * selection process assigned yet, Talento Humano adds it later when
 * publishing. Every other field, including `description`, must be filled in
 * regardless of whether this is a solicitud save or a publish.
 *
 * `requireProcess` must be `true` for a publish submission and `false` for a
 * solicitud save — it depends on the ACTION being performed, not on the
 * caller's permissions (a single user, e.g. Admin, can now perform either
 * action, so this can't be pinned to `has(PERM.vacanciesPublish)` alone; see
 * VacancyForm, which validates solicitud saves against a `requireProcess:
 * false` schema instance regardless of the caller's permissions).
 */
export function makeVacancySchema(requireProcess: boolean) {
  return z.object({
    position: z.string().min(1, "Ingresa el nombre del cargo"),
    clientCompany: z.string().min(1, "Selecciona un cliente"),
    contact: z.string().min(1, "Selecciona un contacto"),
    department: z.string().min(1, "Selecciona un departamento"),
    city: z.string().min(1, "Selecciona una ciudad"),
    workMode: z.string().min(1, "Selecciona una modalidad"),
    durationYears: z.number().int().min(0).nullable(),
    durationMonths: z.number().int().min(0).max(11).nullable(),
    career: z.string().min(1, "Selecciona una carrera"),
    process: requireProcess
      ? z.string().min(1, "Selecciona un proceso")
      : z.string(),
    level: z.string().min(1, "Selecciona un nivel"),
    openings: z.number().int().min(1, "Mínimo 1"),
    // Kept `.nullable()` so the schema's input/output type still matches
    // VacancyFormValues (`number | null`, the "not typed yet" sentinel) —
    // `.refine` (not a type-narrowing one) enforces "required" at runtime
    // without collapsing that type.
    experienceYears: z
      .number()
      .int()
      .min(0)
      .nullable()
      .refine((v) => v !== null, {
        message: "Ingresa los años mínimos de experiencia",
      }),
    workSchedule: z.string(),
    requirements: requirementsSchema,
    description: z.string().min(1, "Agrega una descripción del cargo"),
  });
}

/** Default schema (process required) — kept for callers that always publish. */
export const vacancyFormSchema = makeVacancySchema(true);

export const EMPTY_VACANCY_FORM: VacancyFormValues = {
  position: "",
  clientCompany: "",
  contact: "",
  department: "",
  city: "",
  workMode: "onsite",
  durationYears: null,
  durationMonths: null,
  career: "",
  process: "",
  level: "junior",
  openings: 1,
  experienceYears: null,
  workSchedule: "",
  requirements: { knowledge: [], tools: [], skills: [], certifications: [] },
  description: "",
};
