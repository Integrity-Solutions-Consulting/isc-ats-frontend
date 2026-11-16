import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { backendGet } = vi.hoisted(() => ({ backendGet: vi.fn() }));
vi.mock("@/lib/backendFetch", () => ({ backendGet }));
import { GET } from "./route";

describe("Vacancy list catalogs", () => {
  beforeEach(() => { backendGet.mockReset(); });
  it("fetches only the list's filter sources and preserves their labels", async () => {
    backendGet.mockImplementation(async (path: string) => ({ total: 1, items: path.includes('resource_level')
      ? [{ id: 3, code: 'senior', name: 'Senior' }]
      : [{ id: 1, name: path.includes('departments') ? 'Sistemas' : 'Cliente' }] }));
    const response = await GET(new NextRequest('http://localhost/api/catalogs/vacancies?scope=list'));
    const data = await response.json();
    expect(data.clients).toEqual([{ id: '1', label: 'Cliente' }]);
    expect(data.departments).toEqual([{ id: '1', label: 'Sistemas' }]);
    expect(data.resourceLevels).toEqual([{ id: 'senior', label: 'Senior' }]);
    expect(backendGet).toHaveBeenCalledTimes(3);
  });
  it("keeps the full editor catalogs available", async () => {
    backendGet.mockResolvedValue({ items: [], total: 0 });
    expect((await GET(new NextRequest('http://localhost/api/catalogs/vacancies'))).status).toBe(200);
    expect(backendGet).toHaveBeenCalledTimes(9);
  });
  it("isolates a catalog permission failure without dropping other filters", async () => {
    backendGet.mockImplementation(async (path: string) => {
      if (path.includes('departments')) throw new Error('403');
      return { items: [{ id: 1, name: 'Cliente' }], total: 1 };
    });
    const response = await GET(new NextRequest('http://localhost/api/catalogs/vacancies?scope=list'));
    expect(await response.json()).toMatchObject({ departments: [], clients: [{ id: '1', label: 'Cliente' }] });
  });
});
