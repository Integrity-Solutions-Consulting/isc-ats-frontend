import { z } from "zod";

import type { VacancyFormValues } from "./types";

const requirementsSchema = z.object({
  knowledge: z.array(z.string()),
  tools: z.array(z.string()),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
});

/**
 * Base form validation. Description is allowed to be empty here so a vacancy
 * can be saved as a draft; publishing adds the description requirement on top.
 */
export const vacancyFormSchema = z.object({
  position: z.string().min(1, "Ingresa el nombre del cargo"),
  clientCompany: z.string().min(1, "Selecciona un cliente"),
  contact: z.string().min(1, "Selecciona un contacto"),
  department: z.string().min(1, "Selecciona un departamento"),
  city: z.string().min(1, "Selecciona una ciudad"),
  workMode: z.string().min(1, "Selecciona una modalidad"),
  durationYears: z.number().int().min(0).nullable(),
  durationMonths: z.number().int().min(0).max(11).nullable(),
  career: z.string().min(1, "Selecciona una carrera"),
  process: z.string().min(1, "Selecciona un proceso"),
  level: z.string().min(1, "Selecciona un nivel"),
  openings: z.number().int().min(1, "Mínimo 1"),
  experienceYears: z.number().int().min(0),
  workSchedule: z.string(),
  requirements: requirementsSchema,
  description: z.string(),
});

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
  experienceYears: 0,
  workSchedule: "",
  requirements: { knowledge: [], tools: [], skills: [], certifications: [] },
  description: "",
};
