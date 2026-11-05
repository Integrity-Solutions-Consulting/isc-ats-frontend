import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAIAnalysis, getOtherApplications } = vi.hoisted(() => ({
  getAIAnalysis: vi.fn(), getOtherApplications: vi.fn(),
}));
vi.mock("@/features/candidates/api/candidatesApi", () => ({
  getCandidate: vi.fn(async () => ({ id: "1", fullName: "Ana" })),
  getAIAnalysis, getOtherApplications,
}));
vi.mock("@/features/candidates/api/candidatesServerApi", () => ({ getAllNotesForCandidate: vi.fn(async () => []) }));
vi.mock("@/features/candidates/components/CandidatesDirectoryHeader", () => ({ CandidateDirectoryHeader: () => null }));
vi.mock("@/features/candidates/components/PersonalDataCard", () => ({ PersonalDataCard: () => null }));
vi.mock("@/features/candidates/components/NotesReadOnlyCard", () => ({ NotesReadOnlyCard: () => null }));
vi.mock("@/features/candidates/components/AIAnalysisReadOnlyBlock", () => ({ AIAnalysisReadOnlyBlock: () => null }));
import Page from "./page";

const open = (query: { vacancyId?: string; appId?: string }) => Page({ params: Promise.resolve({ candidateId: "1" }), searchParams: Promise.resolve(query) });
describe("Candidate directory application selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOtherApplications.mockResolvedValue([
      { applicationId: "11", vacancyId: "4", vacancyTitle: "Developer" },
      { applicationId: "12", vacancyId: "5", vacancyTitle: "Designer" },
    ]);
    getAIAnalysis.mockResolvedValue(null);
  });
  it("requires a selection when there are multiple applications", async () => {
    await open({});
    expect(getAIAnalysis).not.toHaveBeenCalled();
  });
  it("loads the analysis for the requested vacancy", async () => {
    await open({ vacancyId: "5" });
    expect(getAIAnalysis).toHaveBeenCalledExactlyOnceWith("12");
  });
  it("keeps applications to the same vacancy separate", async () => {
    getOtherApplications.mockResolvedValue([
      { applicationId: "11", vacancyId: "4" }, { applicationId: "12", vacancyId: "4" },
    ]);
    await open({ vacancyId: "4" });
    expect(getAIAnalysis).not.toHaveBeenCalled();
    await open({ vacancyId: "4", appId: "12" });
    expect(getAIAnalysis).toHaveBeenCalledExactlyOnceWith("12");
  });
  it("does not load an application belonging to another candidate", async () => {
    await open({ appId: "999" });
    expect(getAIAnalysis).not.toHaveBeenCalled();
  });
});
