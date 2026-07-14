import { describe, it, expect } from "vitest";

import { mapVacancy, type BackendVacancyItem } from "./_helpers";

function backendItem(overrides: Partial<BackendVacancyItem> = {}): BackendVacancyItem {
  return {
    id: 1,
    vacancy_name: "Dev",
    client_company: "Acme",
    contact_id: 1,
    contact: "Jane Doe",
    department: "IT",
    process: "",
    career: "Systems",
    city: "Quito",
    work_mode: "onsite",
    resource_level: "junior",
    vacancy_status: "solicitud",
    openings: 1,
    experience_years: 0,
    work_schedule: null,
    project_duration_years: 0,
    project_duration_months: 0,
    description: null,
    profile_requirements: null,
    profile_template_id: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("mapVacancy", () => {
  it("maps the backend vacancy_status code straight through", () => {
    const vacancy = mapVacancy(backendItem({ vacancy_status: "solicitud" }));
    expect(vacancy.status).toBe("solicitud");
  });

  it("falls back to 'solicitud' (not 'draft') when vacancy_status is missing", () => {
    const vacancy = mapVacancy(
      backendItem({ vacancy_status: undefined as unknown as string }),
    );
    expect(vacancy.status).toBe("solicitud");
  });
});
