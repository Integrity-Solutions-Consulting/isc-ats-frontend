import type { Vacancy, VacancyFormValues } from "../types";
import type { MockCatalogs } from "./mockData";
import { serverAuthHeaders } from "@/lib/serverAuthHeaders";
import { INTERNAL_BASE_URL as BASE } from "@/lib/internalBaseUrl";

// ── List ──────────────────────────────────────────────────────────────────────

export async function listVacancies(): Promise<Vacancy[]> {
  try {
    const res = await fetch("/api/vacancies", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as Vacancy[] | { error: string };
      if (!("error" in data)) return data;
    }
  } catch {}
  return [];
}

// ── Detail ────────────────────────────────────────────────────────────────────

export async function getVacancy(id: string): Promise<Vacancy | null> {
  if (!/^\d+$/.test(id)) return null;
  try {
    const res = await fetch(`${BASE}/api/recruitment/vacancies/${id}`, {
      cache: 'no-store',
      headers: await serverAuthHeaders(),
    });
    if (res.ok) return (await res.json()) as Vacancy | null;
  } catch {}
  return null;
}

// ── Catalogs ──────────────────────────────────────────────────────────────────

export async function getVacancyCatalogs(): Promise<MockCatalogs> {
  try {
    const res = await fetch("/api/catalogs/vacancies", { cache: "no-store" });
    if (res.ok) return res.json() as Promise<MockCatalogs>;
  } catch {}
  return {
    clients: [], departments: [], cities: [],
    careers: [], contacts: [], processes: [], profileTemplates: [],
    vacancyNames: [], resourceLevels: [], workModes: [],
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createVacancy(
  values: VacancyFormValues,
  status: "draft" | "active",
): Promise<Vacancy> {
  const res = await fetch("/api/vacancies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values, status }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Error al crear la vacante");
  }
  return res.json() as Promise<Vacancy>;
}

export async function updateVacancy(
  id: string,
  values: VacancyFormValues,
  status?: Vacancy["status"],
): Promise<Vacancy> {
  const res = await fetch(`/api/recruitment/vacancies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values, status }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Error al actualizar la vacante");
  }
  return res.json() as Promise<Vacancy>;
}

export async function deleteVacancy(id: string): Promise<void> {
  const res = await fetch(`/api/recruitment/vacancies/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Error al eliminar la vacante");
  }
}

export async function reactivateVacancy(id: string): Promise<void> {
  const res = await fetch(`/api/recruitment/vacancies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: true }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Error al reactivar la vacante");
  }
}
