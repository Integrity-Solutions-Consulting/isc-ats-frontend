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
