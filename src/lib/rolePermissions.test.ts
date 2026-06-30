import { describe, it, expect } from "vitest";
import { computeRolePermissionSync } from "./rolePermissions";

// Backend catalog stub: code -> id. `knownCodes` is the set of codes the Roles
// screen rendered; codes outside it must never be revoked.
const permissionIdByCode = new Map<string, number>([
  ["recruitment.vacancies.read", 1],
  ["recruitment.vacancies.create", 2],
  ["recruitment.vacancies.update", 3],
  ["recruitment.vacancies.delete", 4],
  ["org.processes.read", 5],
  ["storage.files.read", 90],
]);

const perm = (id: number, code: string) => ({ id, code });

describe("computeRolePermissionSync", () => {
  it("preserves permissions outside the rendered catalog (no mutilation)", () => {
    const knownCodes = new Set(["recruitment.vacancies.read"]); // partial catalog
    const current = [
      perm(1, "recruitment.vacancies.read"),
      perm(90, "storage.files.read"), // not in knownCodes
    ];
    // User saves with nothing selected.
    const plan = computeRolePermissionSync(current, [], permissionIdByCode, knownCodes);

    expect(plan.toRevoke).toEqual([1]);
    expect(plan.toRevoke).not.toContain(90);
    expect(plan.toGrant).toEqual([]);
  });

  it("grants newly selected codes", () => {
    const knownCodes = new Set(permissionIdByCode.keys());
    const current = [perm(1, "recruitment.vacancies.read")];
    const plan = computeRolePermissionSync(
      current,
      ["recruitment.vacancies.read", "recruitment.vacancies.create"],
      permissionIdByCode,
      knownCodes,
    );
    expect(plan.toGrant).toEqual([2]);
    expect(plan.toRevoke).toEqual([]);
  });

  it("revokes a deselected code that is part of the catalog", () => {
    const knownCodes = new Set(permissionIdByCode.keys());
    const current = [
      perm(1, "recruitment.vacancies.read"),
      perm(2, "recruitment.vacancies.create"),
    ];
    const plan = computeRolePermissionSync(
      current,
      ["recruitment.vacancies.read"],
      permissionIdByCode,
      knownCodes,
    );
    expect(plan.toRevoke).toEqual([2]);
    expect(plan.toGrant).toEqual([]);
  });

  it("ignores selected codes that are not in the backend catalog", () => {
    const knownCodes = new Set(permissionIdByCode.keys());
    const plan = computeRolePermissionSync(
      [],
      ["does.not.exist"],
      permissionIdByCode,
      knownCodes,
    );
    expect(plan.toGrant).toEqual([]);
    expect(plan.toRevoke).toEqual([]);
  });
});
