import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { backendGet, getRoleUserCounts } = vi.hoisted(() => ({ backendGet: vi.fn(), getRoleUserCounts: vi.fn() }));
vi.mock("@/lib/backendFetch", () => ({ backendGet, backendPost: vi.fn() }));
vi.mock("@/lib/rolePermissions", () => ({ getRoleUserCounts }));
import { GET } from "./route";

describe("Role options", () => {
  it("does not download users or individual permission lists for the user form", async () => {
    backendGet.mockResolvedValue({ items: [{ id: 3, name: 'recruiter' }], total: 1 });
    const response = await GET(new NextRequest('http://localhost/api/auth/roles?scope=options'));
    expect(await response.json()).toEqual([{ id: '3', name: 'recruiter' }]);
    expect(backendGet).toHaveBeenCalledTimes(1);
    expect(getRoleUserCounts).not.toHaveBeenCalled();
  });
});
