import type { CatalogOption, ProfileTemplate, Vacancy } from "../types";
export type { CatalogOption, ProfileTemplate, Vacancy };

// Mock data removed — all data comes from the backend.

export const MOCK_VACANCIES: Vacancy[] = [];
export const MOCK_PROFILE_TEMPLATES: ProfileTemplate[] = [];

export const MOCK_CATALOGS = {
  clients: [] as CatalogOption[],
  departments: [] as CatalogOption[],
  cities: [] as CatalogOption[],
  careers: [] as CatalogOption[],
  contacts: [] as CatalogOption[],
  processes: [] as CatalogOption[],
  profileTemplates: [] as ProfileTemplate[],
  vacancyNames: [] as CatalogOption[],
  resourceLevels: [] as CatalogOption[],
  workModes: [] as CatalogOption[],
};

export type MockCatalogs = typeof MOCK_CATALOGS;
