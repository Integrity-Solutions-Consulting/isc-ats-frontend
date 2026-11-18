import { describe, expect, it } from "vitest";
import { getBrandAssets, isChristmasSeason } from "./christmasSeason";

describe("Annual Christmas season in Ecuador", () => {
  it.each([
    ["2026-11-17T04:59:59.999Z", false],
    ["2026-11-17T05:00:00.000Z", true],
    ["2026-12-25T17:00:00.000Z", true],
    ["2027-01-05T04:59:59.999Z", true],
    ["2027-01-05T05:00:00.000Z", false],
    ["2027-06-01T05:00:00.000Z", false],
    ["2027-11-17T04:59:59.999Z", false],
    ["2027-11-17T05:00:00.000Z", true],
    ["2028-01-05T05:00:00.000Z", false],
  ])("%s selects Christmas = %s", (date, expected) => {
    expect(isChristmasSeason(new Date(date))).toBe(expected);
  });

  it("switches all three official logos together", () => {
    expect(getBrandAssets(false)).toEqual({
      icon: "/brand/logo_integrity_icon.svg",
      white: "/brand/LogoBlanco.svg",
      full: "/brand/logo_integrity_full.svg",
    });
    expect(Object.values(getBrandAssets(true)).every((path) => path.endsWith("_nv.svg"))).toBe(true);
  });
});
