import { create } from "zustand";

export interface CandidateDirectoryNavEntry {
  candidateId: string;
  applicationId?: string;
  vacancyId?: string;
  tpId?: string | null;
}

interface CandidateDirectoryNavState {
  page: number;
  filters: import("@/features/candidates/types").CandidateDirectoryFilters;
  setPage: (page: number) => void;
  setFilters: (filters: import("@/features/candidates/types").CandidateDirectoryFilters) => void;
  entries: CandidateDirectoryNavEntry[];
  setEntries: (entries: CandidateDirectoryNavEntry[]) => void;
}

export const useCandidateDirectoryNavStore = create<CandidateDirectoryNavState>(
  (set) => ({
    page: 0,
    filters: { search: "", career: null, vacancyId: null, status: "", technology: null },
    setPage: (page) => set({ page }),
    setFilters: (filters) => set({ filters, page: 0 }),
    entries: [],
    setEntries: (entries) => set({ entries }),
  }),
);
