import { beforeEach, describe, expect, it, vi } from "vitest";
const { backendGet } = vi.hoisted(() => ({ backendGet: vi.fn() }));
vi.mock("@/lib/backendFetch", () => ({ backendGet, backendErrorResponse: () => new Response(null, { status: 500 }) }));
import { GET } from "./route";

describe("Candidate directory application identities", () => {
  beforeEach(() => vi.clearAllMocks());
  it("uses each application's own score and id, including later pages", async () => {
    backendGet.mockImplementation(async (path: string) => {
      if (path.startsWith("/recruitment/candidates/directory")) return { total: 2, items: [
        { candidate_id: 1, first_name: "Ana", last_name: "Perez", applied_vacancies: [{ id: 4, title: "Developer", match_score: 99 }], is_active: true },
        { candidate_id: 2, first_name: "Luis", last_name: "Perez", applied_vacancies: [], is_active: true },
      ] };
      if (path === "/recruitment/applications?page=1&size=100") return { total: 3, items: [
        { id: 11, candidate_id: 1, vacancy_id: 4, vacancy_name: "Developer", match_score: "70.4", is_active: true },
      ] };
      if (path === "/recruitment/applications?page=2&size=100") return { total: 3, items: [
        { id: 12, candidate_id: 1, vacancy_id: 4, vacancy_name: "Developer", match_score: null, is_active: true },
        { id: 13, candidate_id: 1, vacancy_id: 5, match_score: 10, is_active: false },
      ] };
      throw new Error(path);
    });
    const response = await GET(new Request("http://localhost/api/recruitment/candidates?view=directory") as import("next/server").NextRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data[0].vacancies).toEqual([
      { applicationId: "11", vacancyId: "4", vacancyTitle: "Developer", matchPercent: 70 },
      { applicationId: "12", vacancyId: "4", vacancyTitle: "Developer", matchPercent: null },
    ]);
    expect(data[1].vacancies).toEqual([]);
  });
});
