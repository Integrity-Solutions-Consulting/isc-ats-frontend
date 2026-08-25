import { describe, it, expect, vi, afterEach } from "vitest";

import { getVacancyPipeline, movePipelineCard } from "./pipelineApi";
import type { VacancyPipeline } from "../types";

afterEach(() => {
  vi.unstubAllGlobals();
});

function makePipelineResponse(yearsOfExperience: number | null): VacancyPipeline {
  return {
    stages: [],
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
        yearsOfExperience,
        updatedAt: "2026-08-20T12:00:00.000Z",
      },
    ],
    rejectionSummary: { total: 0, reasons: [] },
  };
}

describe("getVacancyPipeline — yearsOfExperience mapping", () => {
  it("passes a declared yearsOfExperience straight through", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makePipelineResponse(2.5),
    });
    vi.stubGlobal("fetch", fetchMock);

    const pipeline = await getVacancyPipeline("vac-1");

    expect(pipeline.cards[0].yearsOfExperience).toBe(2.5);
  });

  it("passes a null yearsOfExperience straight through — undeclared is never coerced to 0", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makePipelineResponse(null),
    });
    vi.stubGlobal("fetch", fetchMock);

    const pipeline = await getVacancyPipeline("vac-1");

    expect(pipeline.cards[0].yearsOfExperience).toBeNull();
  });
});

describe("movePipelineCard", () => {
  it("PATCHes current_stage_id/current_status_id without rejection_reason when omitted", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await movePipelineCard("app-1", "2");

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ current_stage_id: 2, current_status_id: null });
  });

  it("includes rejection_reason in the PATCH body when moving to the rejected column", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await movePipelineCard("app-1", "rejected", "No cumple el perfil técnico.");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/recruitment/applications/app-1");
    const body = JSON.parse(init.body as string);
    // Number("rejected") is NaN → JSON.stringify serializes it as null, matching
    // the backend's sentinel for "no current stage" (rejected).
    expect(body).toEqual({
      current_stage_id: null,
      current_status_id: null,
      rejection_reason: "No cumple el perfil técnico.",
    });
  });

  it("throws with the backend's error message when the PATCH fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "rejection_reason is required", detail: "rejection_reason is required" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(movePipelineCard("app-1", "rejected")).rejects.toThrow(
      "rejection_reason is required",
    );
  });
});
