import { create } from 'zustand';

export interface TalentPoolNavEntry {
  candidateId: string;
  /** Talent-pool record id — preserved to show the "remove" action on detail. */
  tpId: string;
}

interface TalentPoolNavState {
  entries: TalentPoolNavEntry[];
  setEntries: (entries: TalentPoolNavEntry[]) => void;
}

export const useTalentPoolNavStore = create<TalentPoolNavState>((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),
}));
