import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import React from "react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ move: vi.fn(), push: vi.fn(), pending: false }));

import { PipelineBoard } from "./PipelineBoard";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";
import type { VacancyPipeline } from "../types";

const samplePipeline: VacancyPipeline = {
  stages: [{ id: "stage-1", vacancyId: "vac-1", name: "Por revisar", order: 1, type: "normal" },
    { id: "stage-2", vacancyId: "vac-1", name: "Entrevista", order: 2, type: "normal" },
    { id: "rejected", vacancyId: "vac-1", name: "Rechazados", order: 3, type: "rejected" }],
  cards: [
    {
      id: "app-1",
      candidateId: "cand-1",
      vacancyId: "vac-1",
      stageId: "stage-1",
      candidateName: "Jane Doe",
      skills: ['SQL'],
      initials: "JD",
      avatarColor: "bg-primary-600",
      matchPercent: 80,
      matchStatus: "done",
      stageStatus: "pending_review",
      city: "Guayaquil",
      university: "ESPOL",
      isStudying: false,
      salaryExpectation: 1200,
      yearsOfExperience: 3,
      updatedAt: new Date().toISOString(),
    },
  ],
  rejectionSummary: { total: 0, reasons: [] },
};

vi.mock("../hooks/usePipeline", () => ({
  usePipeline: () => ({ data: samplePipeline, isLoading: false, isError: false, refetch: vi.fn() }),
  usePendingPipelineCards: () => mocks.pending ? ['app-1'] : [],
  useMovePipelineCard: () => ({ mutateAsync: mocks.move }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderBoard(codes: string[]) {
  return render(
    <PermissionsProvider codes={codes} loaded>
      <PipelineBoard vacancyId="vac-1" vacancy={{ position: 'Developer', clientCompany: 'Cliente' }} />
    </PermissionsProvider>,
  );
}


vi.mock("@/features/candidates/hooks/useCandidates", () => ({
  useCandidateDirectory: () => ({ data: [], error: null, refetch: vi.fn() }),
}));

describe("Pipeline table", () => {
  it('keeps Excel inside the filters and applies technology selections to exports and profile links', async () => {
    const user = userEvent.setup();
    renderBoard([PERM.applicationsUpdate]);
    const download = screen.getByRole('button', { name: 'Descargar Excel' });
    const search = screen.getByPlaceholderText('Buscar candidato por nombre');
    expect(search.parentElement?.parentElement).toContainElement(download);
    await user.click(screen.getByRole('button', { name: /Tecnologías y conocimientos/ }));
    await user.click(screen.getByRole('checkbox', { name: 'SQL' }));
    await user.keyboard('{Escape}');
    expect(window.location.search).toContain('technologies=');
    expect(download).toHaveAttribute('title', 'Exportar los 1 postulantes que coinciden con los filtros');
    fireEvent.click(screen.getByText('Jane Doe'));
    expect(mocks.push).toHaveBeenCalledWith(expect.stringContaining('technologies='));
    fireEvent.change(search, { target: { value: 'Nobody' } });
    expect(download).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(window.location.search).not.toContain('technologies=');
    expect(download).toBeEnabled();
  });
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.move.mockResolvedValue(undefined);
    mocks.pending = false;
    window.history.replaceState(null, "", "/");
  });

  it("shows the stage without an editing menu when permission is missing", () => {
    renderBoard([]);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Por revisar", { selector: "td span" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cambiar estado/ })).not.toBeInTheDocument();
  });

  it("changes the exact application using the keyboard without opening the profile", async () => {
    const user = userEvent.setup();
    renderBoard([PERM.applicationsUpdate]);
    screen.getByRole("button", { name: /Cambiar estado/ }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menuitemradio", { name: "Por revisar" })).toHaveAttribute("data-disabled");
    expect(screen.getByRole("menuitemradio", { name: "Entrevista" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(mocks.move).toHaveBeenCalledWith({
      cardId: "app-1", fromStageId: "stage-1", toStageId: "stage-2",
    }));
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("requires a rejection reason and leaves the stage unchanged on cancel", async () => {
    const user = userEvent.setup();
    renderBoard([PERM.applicationsUpdate]);
    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Rechazados" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mocks.move).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(mocks.move).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends the required reason when confirming rejection", async () => {
    const user = userEvent.setup();
    renderBoard([PERM.applicationsUpdate]);
    await user.click(screen.getByRole("button", { name: /Cambiar estado/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Rechazados" }));
    await user.type(screen.getByLabelText(/Motivo del rechazo/), "No cumple con la experiencia requerida");
    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    await waitFor(() => expect(mocks.move).toHaveBeenCalledWith({
      cardId: "app-1", fromStageId: "stage-1", toStageId: "rejected",
      rejectionReason: "No cumple con la experiencia requerida",
    }));
  });

  it("disables only the saving candidate and keeps other rows usable", async () => {
    const user = userEvent.setup();
    samplePipeline.cards.push({ ...samplePipeline.cards[0], id: "app-2", candidateId: "cand-2", candidateName: "John Smith" });
    mocks.pending = true;
    renderBoard([PERM.applicationsUpdate]);
    expect(screen.getByRole("button", { name: /Cambiar estado de Jane/ })).toBeDisabled();
    const other = screen.getByRole("button", { name: /Cambiar estado de John/ });
    expect(other).toBeEnabled();
    await user.click(other);
    await user.click(screen.getByRole("menuitemradio", { name: "Entrevista" }));
    expect(mocks.move).toHaveBeenCalledWith({ cardId: "app-2", fromStageId: "stage-1", toStageId: "stage-2" });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(document.body.style.pointerEvents).not.toBe("none");
    samplePipeline.cards.pop();
    expect(screen.getByRole("status")).toHaveTextContent("Guardando");
  });

  it("filters by process stage, preserves it in profile links and clears it", () => {
    renderBoard([PERM.applicationsUpdate]);
    const status = screen.getByRole("combobox", { name: "Estado" });
    fireEvent.change(status, { target: { value: "stage-2" } });
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    expect(window.location.search).toContain("processStageId=stage-2");
    fireEvent.change(status, { target: { value: "stage-1" } });
    fireEvent.click(screen.getByText("Jane Doe"));
    expect(mocks.push).toHaveBeenCalledWith(expect.stringContaining("processStageId=stage-1"));
    fireEvent.change(status, { target: { value: "rejected" } });
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(status).toHaveValue("");
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(window.location.search).not.toContain("processStageId");
  });

  it("preserves vacancy filters in the URL and profile link", () => {
    renderBoard([PERM.applicationsUpdate]);
    const search = screen.getByPlaceholderText(/Buscar/);
    fireEvent.change(search, { target: { value: "Jane" } });
    expect(window.location.search).toContain("Jane");
    fireEvent.click(screen.getByText("Jane Doe"));
    expect(mocks.push).toHaveBeenCalledWith(expect.stringContaining("appId=app-1"));
    expect(mocks.push).toHaveBeenCalledWith(expect.stringContaining("Jane"));
    fireEvent.change(search, { target: { value: "Nobody" } });
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });
});
