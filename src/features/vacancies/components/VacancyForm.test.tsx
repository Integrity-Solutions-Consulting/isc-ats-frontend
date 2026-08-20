import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { VacancyForm } from "./VacancyForm";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";
import { EMPTY_VACANCY_FORM } from "../formSchema";
import { createVacancy, updateVacancy } from "../api/vacanciesApi";
import { pipelineKeys } from "@/features/pipeline/hooks/usePipeline";

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

/** Every field a publish save validates, so persist() is actually reached. */
const COMPLETE_VALUES = {
  description: "Descripción completa del puesto",
  clientCompany: "1",
  contact: "1",
  department: "1",
  city: "1",
  career: "1",
  process: "1",
  experienceYears: 2,
  workSchedule: "08:00 - 17:00",
  isIndefiniteDuration: true,
};

function renderForm(
  codes: string[],
  overrides: Partial<typeof EMPTY_VACANCY_FORM> = {},
  opts: { mode?: "create" | "edit"; vacancyId?: string; currentStatus?: "active" | "solicitud" } = {},
) {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const result = render(
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider codes={codes} loaded>
        <VacancyForm
          mode={opts.mode ?? "create"}
          vacancyId={opts.vacancyId}
          currentStatus={opts.currentStatus}
          title="Nueva vacante"
          initialValues={{ ...EMPTY_VACANCY_FORM, position: "Dev", ...overrides }}
        />
      </PermissionsProvider>
    </QueryClientProvider>,
  );
  return { ...result, invalidateSpy };
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
      workSchedule: "08:00 - 17:00",
      isIndefiniteDuration: true,
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
      workSchedule: "08:00 - 17:00",
      isIndefiniteDuration: true,
    });
    await user.click(screen.getByRole("button", { name: /publicar vacante/i }));
    await waitFor(() => expect(createVacancy).toHaveBeenCalled());
    expect(createVacancy).toHaveBeenCalledWith(expect.anything(), "active");
  });
});

describe("VacancyForm — cache invalidation after an edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The vacancy header strip reads `openings` from the shared pipeline query,
  // not from the server-rendered stats prop. With the global 60s staleTime, a
  // save that only invalidates the vacancy keys leaves the strip showing the
  // pre-edit figure until a full page reload.
  it("invalidates the pipeline query when publishing an edit, so the header strip refreshes", async () => {
    const user = userEvent.setup();
    const { invalidateSpy } = renderForm([PERM.vacanciesPublish], COMPLETE_VALUES, {
      mode: "edit",
      vacancyId: "7",
    });

    await user.click(screen.getByRole("button", { name: /publicar vacante/i }));
    await waitFor(() => expect(updateVacancy).toHaveBeenCalled());

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: pipelineKeys.pipeline("7") });
  });

  it("invalidates the pipeline query when saving an edit as a solicitud", async () => {
    const user = userEvent.setup();
    const { invalidateSpy } = renderForm([PERM.vacanciesCreate], COMPLETE_VALUES, {
      mode: "edit",
      vacancyId: "7",
    });

    await user.click(screen.getByRole("button", { name: /guardar solicitud/i }));
    await waitFor(() => expect(updateVacancy).toHaveBeenCalled());

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: pipelineKeys.pipeline("7") });
  });
});

describe("VacancyForm — submit button label reflects what it actually does", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("says 'Publicar vacante' when creating a new vacancy", () => {
    renderForm([PERM.vacanciesPublish]);
    expect(screen.getByRole("button", { name: /publicar vacante/i })).toBeInTheDocument();
  });

  it("says 'Publicar vacante' when editing a 'solicitud' that has never gone live", () => {
    renderForm([PERM.vacanciesPublish], {}, {
      mode: "edit",
      vacancyId: "7",
      currentStatus: "solicitud",
    });
    expect(screen.getByRole("button", { name: /publicar vacante/i })).toBeInTheDocument();
  });

  it("says 'Guardar cambios' instead of 'Publicar vacante' when editing an already-active vacancy", () => {
    renderForm([PERM.vacanciesPublish], {}, {
      mode: "edit",
      vacancyId: "7",
      currentStatus: "active",
    });
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publicar vacante/i })).not.toBeInTheDocument();
  });

  it("still persists status 'active' when clicking 'Guardar cambios' on a live vacancy", async () => {
    const user = userEvent.setup();
    renderForm([PERM.vacanciesPublish], COMPLETE_VALUES, {
      mode: "edit",
      vacancyId: "7",
      currentStatus: "active",
    });

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() => expect(updateVacancy).toHaveBeenCalled());
    expect(updateVacancy).toHaveBeenCalledWith("7", expect.anything(), "active");
  });
});
