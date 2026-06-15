import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles conditional falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
