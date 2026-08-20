import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";

import { PipelineBoard } from "./PipelineBoard";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { PERM } from "@/features/auth/permissions";
import type { VacancyPipeline } from "../types";

const samplePipeline: VacancyPipeline = {
  stages: [{ id: "stage-1", vacancyId: "vac-1", name: "Por revisar", order: 1, type: "normal" }],
  cards: [
    {
      id: "app-1",
      candidateId: "cand-1",
      vacancyId: "vac-1",
      stageId: "stage-1",
      candidateName: "Jane Doe",
      initials: "JD",
      avatarColor: "bg-primary-600",
      matchPercent: 80,
      matchStatus: "done",
      stageStatus: "pending_review",
      city: "Guayaquil",
      isStudying: false,
      salaryExpectation: 1200,
      updatedAt: new Date().toISOString(),
    },
  ],
  rejectionSummary: { total: 0, reasons: [] },
};

vi.mock("../hooks/usePipeline", () => ({
  usePipeline: () => ({ data: samplePipeline, isLoading: false, isError: false, refetch: vi.fn() }),
  useMovePipelineCard: () => ({ mutate: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function renderBoard(codes: string[]) {
  return render(
    <PermissionsProvider codes={codes} loaded>
      <PipelineBoard vacancyId="vac-1" />
    </PermissionsProvider>,
  );
}

describe("PipelineBoard — move gating", () => {
  it("renders cards as non-draggable without applicationsUpdate", () => {
    renderBoard([]);
    const draggable = screen.getByText("Jane Doe").closest("div[role='button']");
    expect(draggable).not.toBeInTheDocument();
  });

  it("renders cards as draggable with applicationsUpdate", () => {
    renderBoard([PERM.applicationsUpdate]);
    const draggable = screen.getByText("Jane Doe").closest("div[role='button']");
    expect(draggable).toBeInTheDocument();
  });
});
