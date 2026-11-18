import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SeasonalBrandingProvider, useChristmasSeason } from "./SeasonalBrandingProvider";
import { isChristmasSeason } from "@/shared/branding/christmasSeason";

function Status() {
  return <output>{useChristmasSeason() ? "Christmas" : "Normal"}</output>;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Season changes in an open tab", () => {
  it.each([
    ["2026-11-17T04:59:59.000Z", "Normal", "Christmas"],
    ["2027-01-05T04:59:59.000Z", "Christmas", "Normal"],
  ])("updates at Ecuador midnight: %s", async (date, before, after) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(date));
    render(<SeasonalBrandingProvider initialActive={isChristmasSeason()}><Status /></SeasonalBrandingProvider>);
    expect(screen.getByText(before)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
    expect(screen.getByText(after)).toBeInTheDocument();
  });

  it("rechecks the date when returning from a suspended tab", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T17:00:00Z"));
    const { unmount } = render(<SeasonalBrandingProvider initialActive><Status /></SeasonalBrandingProvider>);
    expect(screen.getByText("Christmas")).toBeInTheDocument();
    act(() => {
      vi.setSystemTime(new Date("2027-01-05T05:00:01Z"));
      window.dispatchEvent(new Event("focus"));
    });
    expect(screen.getByText("Normal")).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
