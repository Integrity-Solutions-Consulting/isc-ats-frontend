import { NextResponse } from "next/server";

import { backendGet } from "@/lib/backendFetch";
import type { CatalogOption, MockCatalogs } from "@/features/vacancies/api/mockData";

interface BackendPage<T> {
  items: T[];
  total: number;
}
interface BackendParam {
  id: number;
  type: string;
  code: string;
  name: string;
}
interface BackendCompany {
  id: number;
  name: string;
}
interface BackendDept {
  id: number;
  name: string;
}
interface BackendContact {
  id: number;
  first_name: string;
  last_name: string;
}
interface BackendProcess {
  id: number;
  name: string;
}

function toOption(id: number, label: string): CatalogOption {
  return { id: String(id), label };
}

async function fetchParams(type: string): Promise<CatalogOption[]> {
  const data = await backendGet<BackendPage<BackendParam>>(
    `/org/parameters?type=${type}&size=100`,
  );
  return data.items.map((p) => toOption(p.id, p.name));
}

/**
 * Fetches a catalog source in isolation so a permission failure (403) on one
 * source (e.g. client-companies/departments for the Talento Humano role)
 * never prevents the other sources from being returned.
 */
async function fetchSafe<T>(fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher();
  } catch {
    return fallback;
  }
}

export async function GET(): Promise<NextResponse> {
  const emptyPage = { items: [], total: 0 };

  const [companies, departments, contacts, processes, cities, careers, workModesData, levelsData, names] =
    await Promise.all([
      fetchSafe(() => backendGet<BackendPage<BackendCompany>>("/org/client-companies?size=100"), emptyPage),
      fetchSafe(() => backendGet<BackendPage<BackendDept>>("/org/departments?size=100"), emptyPage),
      fetchSafe(() => backendGet<BackendPage<BackendContact>>("/org/contacts?size=100"), emptyPage),
      fetchSafe(() => backendGet<BackendPage<BackendProcess>>("/org/processes?size=100"), emptyPage),
      fetchSafe(() => fetchParams("city"), [] as CatalogOption[]),
      fetchSafe(() => fetchParams("career"), [] as CatalogOption[]),
      fetchSafe(() => backendGet<BackendPage<BackendParam>>("/org/parameters?type=work_mode&size=100"), emptyPage),
      fetchSafe(() => backendGet<BackendPage<BackendParam>>("/org/parameters?type=resource_level&size=100"), emptyPage),
      fetchSafe(() => fetchParams("vacancy_name"), [] as CatalogOption[]),
    ]);

  const catalogs: MockCatalogs = {
    clients: companies.items.map((c) => toOption(c.id, c.name)),
    departments: departments.items.map((d) => toOption(d.id, d.name)),
    contacts: contacts.items.map((c) =>
      toOption(c.id, `${c.first_name} ${c.last_name}`),
    ),
    processes: processes.items.map((p) => toOption(p.id, p.name)),
    cities,
    careers,
    profileTemplates: [],
    vacancyNames: names,
    resourceLevels: levelsData.items.map((p) => ({ id: p.code, label: p.name })),
    workModes: workModesData.items.map((p) => ({ id: p.code, label: p.name })),
  };

  return NextResponse.json(catalogs);
}
