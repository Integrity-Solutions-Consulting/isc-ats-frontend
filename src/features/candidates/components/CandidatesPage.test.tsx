import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within, cleanup } from "@testing-library/react";
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
  it("filters typed cities and allows selecting available cities", () => {
    render(<CandidatesPage />);
    const city = screen.getByRole("combobox", { name: "Filtrar por ciudad" });
    fireEvent.change(city, { target: { value: "quito" } });
    expect(candidateRows()).toHaveLength(2);
    fireEvent.change(city, { target: { value: "" } });
    fireEvent.focus(city);
    fireEvent.mouseDown(screen.getByRole("option", { name: "Guayaquil" }));
    expect(candidateRows()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(candidateRows()).toHaveLength(3);
    expect(city).toHaveValue("");
  });
  it("filters each application inclusively using comma or point decimals and clears both bounds", () => {
    render(<CandidatesPage />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Aspiración salarial desde" }), { target: { value: "1200,50" } });
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
    for (const value of ["abc", "1e3", "-1", "1,2.3", "12.345"]) {
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
