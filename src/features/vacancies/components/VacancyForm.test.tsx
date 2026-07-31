import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { VacancyForm } from "./VacancyForm";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";
import { EMPTY_VACANCY_FORM } from "../formSchema";
import { createVacancy } from "../api/vacanciesApi";

// Section children are exercised by their own dedicated tests (SelectionSection,
// etc). Stubbing them here isolates VacancyForm's own logic: the permission-gated
// save bar and the schema/status it wires up.
vi.mock("./vacancy-form/BasicInfoSection", () => ({ BasicInfoSection: () => null }));
vi.mock("./vacancy-form/LocationSection", () => ({ LocationSection: () => null }));
vi.mock("./vacancy-form/SelectionSection", () => ({ SelectionSection: () => null }));
vi.mock("./vacancy-form/ProfileSection", () => ({ ProfileSection: () => null }));
vi.mock("./vacancy-form/DescriptionSection", () => ({ DescriptionSection: () => null }));

vi.mock("../api/vacanciesApi", () => ({
  createVacancy: vi.fn().mockResolvedValue({ id: "1" }),
  updateVacancy: vi.fn().mockResolvedValue({ id: "1" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function renderForm(codes: string[], overrides: Partial<typeof EMPTY_VACANCY_FORM> = {}) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider codes={codes} loaded>
        <VacancyForm
          mode="create"
          title="Nueva vacante"
          initialValues={{ ...EMPTY_VACANCY_FORM, position: "Dev", ...overrides }}
        />
      </PermissionsProvider>
    </QueryClientProvider>,
  );
}

describe("VacancyForm — permission-gated save bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows only 'Guardar solicitud' for a creator without publish (Comercial/Proyecto)", () => {
    renderForm([PERM.vacanciesCreate]);
    expect(screen.getByRole("button", { name: /guardar solicitud/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publicar vacante/i })).not.toBeInTheDocument();
  });

  it("hides 'Guardar solicitud' and shows only 'Publicar vacante' for a publisher without create (TH)", () => {
    renderForm([PERM.vacanciesPublish]);
    expect(screen.queryByRole("button", { name: /guardar solicitud/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publicar vacante/i })).toBeInTheDocument();
  });

  it("shows both 'Guardar solicitud' and 'Publicar vacante' for Admin (create + publish)", () => {
    renderForm([PERM.vacanciesPublish, PERM.vacanciesCreate]);
    expect(screen.getByRole("button", { name: /guardar solicitud/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publicar vacante/i })).toBeInTheDocument();
  });

  it("persists status 'solicitud' (not 'draft') when a non-publisher clicks 'Guardar solicitud'", async () => {
    const user = userEvent.setup();
    // Only process/template stay optional for a solicitud save — everything
    // else (including description) is validated before persist() is called.
    renderForm([PERM.vacanciesCreate], {
      description: "Descripción completa del puesto",
      clientCompany: "1",
      contact: "1",
      department: "1",
      city: "1",
      career: "1",
      experienceYears: 2,
    });
    await user.click(screen.getByRole("button", { name: /guardar solicitud/i }));
    await waitFor(() => expect(createVacancy).toHaveBeenCalled());
    expect(createVacancy).toHaveBeenCalledWith(expect.anything(), "solicitud");
  });

  it("blocks 'Guardar solicitud' with a friendly field error when required fields are missing", async () => {
    const user = userEvent.setup();
    renderForm([PERM.vacanciesCreate]);
    await user.click(screen.getByRole("button", { name: /guardar solicitud/i }));
    expect(createVacancy).not.toHaveBeenCalled();
  });

  it("persists status 'active' when a publisher submits 'Publicar vacante' with a description filled in", async () => {
    const user = userEvent.setup();
    renderForm([PERM.vacanciesPublish], {
      description: "Descripción completa del puesto",
      clientCompany: "1",
      contact: "1",
      department: "1",
      city: "1",
      career: "1",
      process: "1",
      experienceYears: 2,
    });
    await user.click(screen.getByRole("button", { name: /publicar vacante/i }));
    await waitFor(() => expect(createVacancy).toHaveBeenCalled());
    expect(createVacancy).toHaveBeenCalledWith(expect.anything(), "active");
  });
});
