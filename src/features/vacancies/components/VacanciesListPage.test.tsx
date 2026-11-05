import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVacanciesListStore } from "@/shared/stores/vacanciesListStore";
import { VacanciesListPage } from "./VacanciesListPage";
import type { Vacancy, VacancyFilters } from "../types";

const mocks = vi.hoisted(() => ({ push: vi.fn(), vacancies: [] as Vacancy[], loading: false }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/auth/PermissionsProvider", () => ({ usePermissions: () => ({ has: () => false }) }));
vi.mock("../hooks/useVacancies", () => ({
  useVacancies: () => ({ data: mocks.vacancies, isLoading: mocks.loading, isError: false }),
  useVacancyCatalogs: () => ({ data: {
    clients: [{ id: "client", label: "Cliente" }],
    departments: [{ id: "department", label: "Departamento" }],
    resourceLevels: [],
  } }),
}));

// Keep the real list filtering and pagination; replace only the filter controls.
vi.mock("./VacancyFilters", () => ({
  VacancyFilters: ({ filters, onChange }: {
    filters: VacancyFilters;
    onChange: (patch: Partial<VacancyFilters>) => void;
  }) => <>
    <input aria-label="Buscar" value={filters.search} onChange={(event) => onChange({ search: event.target.value })} />
    <button onClick={() => onChange({ clientCompany: "client", department: "department", status: "active", level: "senior", isActiveFilter: "all" })}>Aplicar filtros</button>
    <output data-testid="filters">{JSON.stringify(filters)}</output>
  </>,
}));

function view(detail = false) {
  // Replace the entire page: restoring state must not rely on a mounted provider.
  return detail ? <div>Detalle</div> : <VacanciesListPage />;
}

beforeEach(() => {
  useVacanciesListStore.setState(useVacanciesListStore.getInitialState(), true);
  mocks.push.mockReset();
  mocks.loading = false;
  mocks.vacancies = Array.from({ length: 24 }, (_, index) => ({
    id: String(index + 1), position: `Ingeniero ${index + 1}`,
    clientCompany: "Cliente", department: "Departamento", contact: "Contacto",
    city: "Quito", career: "Sistemas", process: null, workMode: "remote",
    level: "senior", openings: 1, experienceYears: 2, workSchedule: "Completo",
    durationYears: null, durationMonths: null, status: "active", isActive: true,
    requirements: { knowledge: [], tools: [], skills: [], certifications: [] }, description: "",
  }));
});

describe("Vacancies list navigation state", () => {
  it("restores page, search and every filter when the list remounts after a detail visit", () => {
    const { rerender } = render(view());
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar" }), { target: { value: "Ingeniero" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    const filters = screen.getByTestId("filters").textContent;
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ingeniero 16"));
    expect(mocks.push).toHaveBeenCalledWith("/vacantes/16");

    rerender(view(true));
    expect(screen.queryByText("Página 2 de 3")).not.toBeInTheDocument();
    rerender(view());

    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByText("Ingeniero 16")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Buscar" })).toHaveValue("Ingeniero");
    expect(screen.getByTestId("filters").textContent).toBe(filters);
  });

  it("starts at page one when the user changes filters or search", () => {
    render(view());
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar" }), { target: { value: "Ingeniero" } });
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("uses the last available page if records were removed while viewing the detail", () => {
    const { rerender } = render(view());
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    rerender(view(true));
    mocks.vacancies = mocks.vacancies.slice(0, 10);
    rerender(view());
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getByText("Ingeniero 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
  });

  it("does not lose the selected page while data reloads on return", () => {
    const { rerender } = render(view());
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    rerender(view(true));
    mocks.loading = true;
    rerender(view());
    mocks.loading = false;
    rerender(view());
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });
});
