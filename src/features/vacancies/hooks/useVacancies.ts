"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getVacancy,
  getVacancyCatalogs,
  listVacancies,
} from "../api/vacanciesApi";

export const vacancyKeys = {
  all: ["vacancies"] as const,
  detail: (id: string) => ["vacancies", id] as const,
  catalogs: ["vacancies", "catalogs"] as const,
};

export function useVacancies() {
  return useQuery({
    queryKey: vacancyKeys.all,
    queryFn: listVacancies,
  });
}

export function useVacancy(id: string) {
  return useQuery({
    queryKey: vacancyKeys.detail(id),
    queryFn: () => getVacancy(id),
    enabled: Boolean(id),
  });
}

export function useVacancyCatalogs() {
  return useQuery({
    queryKey: vacancyKeys.catalogs,
    queryFn: getVacancyCatalogs,
    staleTime: 5 * 60_000,
  });
}

export function useContactsByClient(clientId: string) {
  return useQuery({
    queryKey: ["contacts", "byClient", clientId] as const,
    queryFn: async () => {
      const res = await fetch(`/api/org/contacts?client_company_id=${clientId}`, {
        cache: "no-store",
      });
      if (!res.ok) return [] as Array<{ id: string; label: string }>;
      const rows = (await res.json()) as Array<{
        id: string;
        firstName: string;
        lastName: string;
      }>;
      return rows.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }));
    },
    enabled: Boolean(clientId),
    staleTime: 5 * 60_000,
  });
}
