import { create } from "zustand";
import type { VacancyFilters } from "@/features/vacancies/types";

interface VacanciesListState {
  page: number;
  filters: VacancyFilters;
  setPage: (page: number) => void;
  setFilters: (patch: Partial<VacancyFilters>) => void;
}

// Like the candidate directory, preserve the list state during client navigation.
// A full reload starts a new in-memory store.
export const useVacanciesListStore = create<VacanciesListState>((set) => ({
  page: 0,
  filters: {
    search: "",
    clientCompany: null,
    department: null,
    status: null,
    level: null,
    isActiveFilter: "active",
  },
  setPage: (page) => set({ page }),
  setFilters: (patch) => set((state) => ({
    filters: { ...state.filters, ...patch },
    page: 0,
  })),
}));
