import { describe, it, expect } from "vitest";

import { resolveDropAction } from "./dropAction";
import type { PipelineStage } from "./types";

const stages: PipelineStage[] = [
  { id: "stage-1", vacancyId: "vac-1", name: "Por revisar", order: 1, type: "normal" },
  { id: "stage-2", vacancyId: "vac-1", name: "Contratado", order: 2, type: "final" },
  { id: "rejected", vacancyId: "vac-1", name: "Rechazados", order: 3, type: "rejected" },
];

describe("resolveDropAction", () => {
  it("returns 'noop' when dropped on its own column", () => {
    expect(resolveDropAction(stages, "stage-1", "stage-1")).toEqual({ type: "noop" });
  });

  it("returns 'noop' when dropped on an unknown stage id", () => {
    expect(resolveDropAction(stages, "stage-1", "not-a-real-stage")).toEqual({ type: "noop" });
  });

  it("returns 'move' when dropped on a normal or final stage", () => {
    expect(resolveDropAction(stages, "stage-1", "stage-2")).toEqual({
      type: "move",
      toStageId: "stage-2",
    });
  });

  it("returns 'reject' when dropped on the virtual Rechazados column", () => {
    expect(resolveDropAction(stages, "stage-1", "rejected")).toEqual({
      type: "reject",
      toStageId: "rejected",
    });
  });
});
