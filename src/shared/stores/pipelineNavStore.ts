import { create } from 'zustand';

export interface PipelineNavEntry {
  candidateId: string;
  appId: string;
  vacancyId: string;
}

interface PipelineNavState {
  entries: PipelineNavEntry[];
  setEntries: (entries: PipelineNavEntry[]) => void;
}

export const usePipelineNavStore = create<PipelineNavState>((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),
}));
