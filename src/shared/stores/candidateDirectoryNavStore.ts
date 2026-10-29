import { create } from "zustand";

export interface CandidateDirectoryNavEntry {
  candidateId: string;
  tpId?: string | null;
}

interface CandidateDirectoryNavState {
  entries: CandidateDirectoryNavEntry[];
  setEntries: (entries: CandidateDirectoryNavEntry[]) => void;
}

export const useCandidateDirectoryNavStore = create<CandidateDirectoryNavState>(
  (set) => ({
    entries: [],
    setEntries: (entries) => set({ entries }),
  }),
);
