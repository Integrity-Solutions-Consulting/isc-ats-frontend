import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { DndContext } from "@dnd-kit/core";

import { CandidateCard } from "./CandidateCard";
import type { PipelineCard } from "../types";

const card: PipelineCard = {
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
  salaryExpectation: 1200,
  updatedAt: new Date().toISOString(),
};

describe("CandidateCard — move (drag) gating", () => {
  it("is draggable by default (canDrag omitted)", () => {
    render(
      <DndContext>
        <CandidateCard card={card} />
      </DndContext>,
    );
    const draggable = screen.getByText("Jane Doe").closest("div[role='button']");
    expect(draggable).toBeInTheDocument();
  });

  it("is NOT draggable when canDrag=false (lacks applicationsUpdate)", () => {
    render(
      <DndContext>
        <CandidateCard card={card} canDrag={false} />
      </DndContext>,
    );
    const draggable = screen.getByText("Jane Doe").closest("div[role='button']");
    expect(draggable).not.toBeInTheDocument();
  });

  it("still renders the view button when not draggable", () => {
    render(
      <DndContext>
        <CandidateCard card={card} canDrag={false} onView={() => {}} />
      </DndContext>,
    );
    expect(screen.getByLabelText("Ver perfil del candidato")).toBeInTheDocument();
  });
});
