import { beforeEach, describe, expect, it, vi } from "vitest";
const { backendGetAllPages } = vi.hoisted(() => ({ backendGetAllPages: vi.fn() }));
vi.mock("@/lib/backendPages", () => ({ backendGetAllPages }));
vi.mock("@/lib/backendFetch", () => ({ backendPost: vi.fn() }));
import { GET } from "./route";

describe("Talent pool list data", () => {
  beforeEach(() => { backendGetAllPages.mockReset(); });
  it("preserves enriched rows and scores without fetching unrelated collections", async () => {
    backendGetAllPages.mockResolvedValue([
      { id: 1, candidate_id: 8, first_name: "Ana", last_name: "Perez", source_vacancy_id: 4, source_vacancy_title: "Developer", match_score: "81.5", is_active: true, skills: ["C++"], tools: ["Git"], avatar_file_id: 19 },
      { id: 2, candidate_id: 9, first_name: "Luis", last_name: "Diaz", source_vacancy_id: 4, match_score: null, is_active: false },
    ]);
    const response = await GET(new Request("http://localhost/api/talent-pool?include_inactive=true") as import("next/server").NextRequest);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([
      { candidateId: "8", candidateName: "Ana Perez", vacancyTitle: "Developer", matchPercent: 82, candidateAvatarFileId: 19, skills: ["C++"], tools: ["Git"] },
      { candidateId: "9", isActive: false, matchPercent: null },
    ]);
    expect(backendGetAllPages).toHaveBeenCalledTimes(1);
  });
  it("supports the previous backend during a rolling deployment", async () => {
    backendGetAllPages.mockResolvedValueOnce([{ id: 1, candidate_id: 8, first_name: "Ana", source_vacancy_id: 4 }]);
    backendGetAllPages.mockResolvedValueOnce([{ candidate_id: 8, vacancy_id: 4, match_score: 75 }]);
    const response = await GET(new Request("http://localhost/api/talent-pool") as import("next/server").NextRequest);
    expect((await response.json())[0].matchPercent).toBe(75);
    expect(backendGetAllPages).toHaveBeenCalledTimes(2);
  });
});
