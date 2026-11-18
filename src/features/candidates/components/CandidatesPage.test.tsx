import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidatesPage } from "./CandidatesPage";
import { useCandidateDirectoryNavStore } from "@/shared/stores/candidateDirectoryNavStore";
import type { CandidateDirectoryEntry } from "../types";

const { push, directory } = vi.hoisted(() => ({ push: vi.fn(), directory: { entries: [] as CandidateDirectoryEntry[] } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../hooks/useCandidates", () => ({
  useCandidateDirectory: () => ({ data: directory.entries, isLoading: false, error: null, refetch: vi.fn() }),
  useAddToTalentPool: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
const candidate: CandidateDirectoryEntry = {
  id: "1", candidateName: "Ana Perez", candidateInitials: "AP", avatarColor: "bg-primary-600",
  career: "Sistemas", phone: "123", email: "ana@example.com", isActive: true,
  inTalentPool: true, skills: [], tools: [], createdAt: "2026-01-01", vacancies: [],
};

function candidateRows() {
  return screen.getAllByRole("button").filter((element) => element.tagName === "TR");
}

describe("Candidates directory rows", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useCandidateDirectoryNavStore.setState({ entries: [], page: 0, filters: { search: "", career: null, vacancyId: null, status: "", technology: null } });
    directory.entries = [{ ...candidate, vacancies: [
      { applicationId: "11", vacancyId: "4", vacancyTitle: "Developer", matchPercent: 90 },
      { applicationId: "12", vacancyId: "4", vacancyTitle: "Developer", matchPercent: null },
    ] }];
  });
  it("allows letters, numbers, spaces and dots in the main search, including when pasting", async () => {
    const user = userEvent.setup();
    render(<CandidatesPage />);
    const search = screen.getByRole("searchbox", { name: "Buscar candidato" });
    await user.type(search, "Ana. 123 ñá@*/");
    expect(search).toHaveValue("Ana. 123 ñá");
    await user.clear(search);
    await user.paste("Jose\u0301@example.com*/ 123");
    expect(search).toHaveValue("Joséexample.com 123");
    expect(useCandidateDirectoryNavStore.getState().filters.search).toBe("Joséexample.com 123");
    await user.clear(search);
    await user.type(search, "Ana");
    expect(candidateRows()).toHaveLength(2);
  });
  it("renders separate rows for submissions to the same vacancy and opens the exact analysis", () => {
    render(<CandidatesPage />);
    const rows = candidateRows();
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("90%")).toBeInTheDocument();
    expect(within(rows[1]).getByText("-")).toBeInTheDocument();
    expect(within(rows[1]).queryByText("90%")).not.toBeInTheDocument();
    fireEvent.click(rows[1]);
    const url = new URL(push.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("appId")).toBe("12");
    expect(url.searchParams.get("vacancyId")).toBe("4");
    expect(useCandidateDirectoryNavStore.getState().entries[1].applicationId).toBe("12");
  });
  it("keeps candidates without applications visible", () => {
    directory.entries = [candidate];
    render(<CandidatesPage />);
    expect(candidateRows()).toHaveLength(1);
    expect(screen.getByText("Sin postulaciones")).toBeInTheDocument();
  });
  it("shows each candidate's latest application in Ecuador time, newest first regardless of candidate id", () => {
    directory.entries = [
      { ...candidate, id: "99", candidateName: "Anterior", vacancies: [{ applicationId: "21", vacancyId: "4", vacancyTitle: "Developer", matchPercent: 80, appliedAt: "2026-11-01T12:00:00Z" }] },
      { ...candidate, id: "1", candidateName: "Reciente", vacancies: [
        { applicationId: "11", vacancyId: "4", vacancyTitle: "Developer", matchPercent: 80, appliedAt: "2026-11-10T12:00:00Z" },
        { applicationId: "12", vacancyId: "4", vacancyTitle: "Developer", matchPercent: 90, appliedAt: "2026-11-18T03:00:00Z" },
      ] },
      { ...candidate, id: "100", candidateName: "Sin fecha", createdAt: "2026-12-01", vacancies: [] },
    ];
    render(<CandidatesPage />);
    expect(screen.getByRole("columnheader", { name: "Última postulación" })).toBeInTheDocument();
    const rows = candidateRows();
    expect(within(rows[0]).getByText("Reciente")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Reciente")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Anterior")).toBeInTheDocument();
    expect(rows[0].querySelector("time")).toHaveAttribute("datetime", "2026-11-18T03:00:00Z");
    expect(within(rows[0]).getByText("17/11/2026")).not.toHaveTextContent("22:00");
    expect(rows[3].querySelector("time")).toBeNull();
    fireEvent.click(rows[0]);
    expect(new URL(push.mock.calls[0][0], "http://localhost").searchParams.get("appId")).toBe("12");
  });
  it("filters minimum match inclusively from 0 to 100 and resets the filter", () => {
    directory.entries = [{ ...candidate, vacancies: [0, 49, 50, 79, 80, 100, null].map((matchPercent, index) => ({
      applicationId: String(index + 1), vacancyId: "4", vacancyTitle: "Developer", matchPercent,
    })) }];
    const view = render(<CandidatesPage />);
    const input = screen.getByRole("textbox", { name: "Filtrar por match mínimo" });
    expect(input).toHaveAttribute("placeholder", "Ej. 80");
    expect(screen.getByText("Match mínimo (%)")).toBeInTheDocument();
    expect(candidateRows()).toHaveLength(7);
    for (const [value, count] of [["0", 6], ["50", 4], ["80", 2], ["100", 1]] as const) {
      fireEvent.change(input, { target: { value } });
      expect(candidateRows()).toHaveLength(count);
    }
    for (const value of ["101", "-1", "abc", "1e2", "50.5", "50,5"]) {
      fireEvent.change(input, { target: { value } });
      expect(input).toHaveValue("100");
      expect(candidateRows()).toHaveLength(1);
    }
    fireEvent.change(input, { target: { value: "80" } });
    view.unmount();
    render(<CandidatesPage />);
    expect(screen.getByRole("textbox", { name: "Filtrar por match mínimo" })).toHaveValue("80");
    expect(candidateRows()).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByRole("textbox", { name: "Filtrar por match mínimo" })).toHaveValue("");
    expect(candidateRows()).toHaveLength(7);
  });
  it("paginates submissions and restores the page after returning to the list", () => {
    directory.entries = [{ ...candidate, vacancies: Array.from({ length: 12 }, (_, index) => ({ applicationId: String(index + 1), vacancyId: String(index + 1), vacancyTitle: `Vacante ${index + 1}`, matchPercent: index })) }];
    const view = render(<CandidatesPage />);
    expect(candidateRows()).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(candidateRows()).toHaveLength(2);
    fireEvent.click(candidateRows()[0]);
    expect(new URL(push.mock.calls[0][0], "http://localhost").searchParams.get("appId")).toBe("11");
    view.unmount();
    render(<CandidatesPage />);
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(candidateRows()).toHaveLength(2);
  });
});


describe("Candidate city and salary filters", () => {
  beforeEach(() => {
    cleanup();
    useCandidateDirectoryNavStore.setState({ page: 0, filters: { search: "", career: null, vacancyId: null, status: "", technology: null } });
    directory.entries = [
      { ...candidate, city: "Quito", vacancies: [
        { applicationId: "11", vacancyId: "4", vacancyTitle: "Developer", matchPercent: null, salaryExpectation: 1200.5 },
        { applicationId: "12", vacancyId: "5", vacancyTitle: "Designer", matchPercent: null, salaryExpectation: 1800 },
      ] },
      { ...candidate, id: "2", city: "Guayaquil", vacancies: [] },
    ];
  });
  it("searches city options by typing and applies the selected city", () => {
    render(<CandidatesPage />);
    const city = screen.getByRole("combobox", { name: "Filtrar por ciudad" });
    expect(city).not.toHaveAttribute("readonly");
    expect(city).toHaveValue("");
    expect(city).toHaveAttribute("placeholder", "Seleccionar ciudad");
    fireEvent.focus(city);
    fireEvent.change(city, { target: { value: "guaya" } });
    expect(screen.getByRole("option", { name: "Guayaquil" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Quito" })).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("option", { name: "Guayaquil" }));
    expect(candidateRows()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(candidateRows()).toHaveLength(3);
    expect(city).toHaveValue("");
  });
  it("filters each application inclusively using point decimals and clears both bounds", () => {
    render(<CandidatesPage />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Aspiración salarial desde" }), { target: { value: "1200.50" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Aspiración salarial hasta" }), { target: { value: "1200.50" } });
    expect(candidateRows()).toHaveLength(1);
    fireEvent.click(candidateRows()[0]);
    expect(useCandidateDirectoryNavStore.getState().entries[0].applicationId).toBe("11");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(candidateRows()).toHaveLength(3);
  });
  it("rejects letters, negative amounts, malformed decimals and flags inverted ranges", () => {
    render(<CandidatesPage />);
    const from = screen.getByRole("spinbutton", { name: "Aspiración salarial desde" });
    expect(from).toHaveAttribute("placeholder", "Ej. 1000.00");
    expect(screen.getByText("Salario desde ($)")).toBeInTheDocument();
    for (const value of ["abc", "1e3", "-1", "1,2.3", "12.345", "1200,50", "$1200", "1+2", "10%", "."]) {
      fireEvent.change(from, { target: { value } });
      expect(from).toHaveValue("");
    }
    fireEvent.change(from, { target: { value: "1800" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Aspiración salarial hasta" }), { target: { value: "1200" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Desde no puede ser mayor que Hasta.");
    expect(from).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Sin resultados para los filtros seleccionados.")).toBeInTheDocument();
    fireEvent.change(from, { target: { value: "1199.50" } });
    fireEvent.keyDown(from, { key: "ArrowUp" });
    expect(from).toHaveValue("1200");
    fireEvent.click(screen.getByRole("button", { name: "Disminuir aspiración salarial desde" }));
    expect(from).toHaveValue("1199");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
