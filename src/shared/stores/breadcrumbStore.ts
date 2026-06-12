import { create } from 'zustand';

interface BreadcrumbState {
  vacancyName: string | null;
  setVacancyName: (name: string | null) => void;
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  vacancyName: null,
  setVacancyName: (name) => set({ vacancyName: name }),
  pageTitle: null,
  setPageTitle: (title) => set({ pageTitle: title }),
}));
