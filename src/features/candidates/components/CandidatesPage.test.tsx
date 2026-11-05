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
