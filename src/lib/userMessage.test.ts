import { describe, it, expect } from "vitest";
import { NETWORK_ERROR_MESSAGE, toUserMessage } from "./userMessage";

const FALLBACK = "No fue posible completar la acción.";

describe("toUserMessage", () => {
  it("keeps the backend's Spanish message", () => {
    // API helpers throw `new Error(detail)` where detail is the backend text —
    // that message is written for the user and must survive.
    const error = new Error("Ya existe un usuario con el correo ana@x.com.");

    expect(toUserMessage(error, FALLBACK)).toBe(
      "Ya existe un usuario con el correo ana@x.com.",
    );
  });

  it.each([
    "Failed to fetch",
    "NetworkError when attempting to fetch resource.",
    "Load failed",
    "Network request failed",
    "The Internet connection appears to be offline.",
  ])("replaces the browser's own failure text: %s", (browserText) => {
    const result = toUserMessage(new Error(browserText), FALLBACK);

    expect(result).toBe(NETWORK_ERROR_MESSAGE);
    expect(result).not.toContain(browserText);
  });

  it("matches browser failure text regardless of casing", () => {
    expect(toUserMessage(new Error("failed to fetch"), FALLBACK)).toBe(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it("uses the fallback for an empty message", () => {
    expect(toUserMessage(new Error(""), FALLBACK)).toBe(FALLBACK);
  });

  it("uses the fallback for a message that is only whitespace", () => {
    expect(toUserMessage(new Error("   "), FALLBACK)).toBe(FALLBACK);
  });

  it("uses the fallback for values that are not Errors", () => {
    expect(toUserMessage("boom", FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage({ detail: "x" }, FALLBACK)).toBe(FALLBACK);
  });

  it("uses the fallback for an aborted request", () => {
    // An abort is not a failure the user caused or needs explained.
    const aborted = new Error("The user aborted a request.");
    aborted.name = "AbortError";

    expect(toUserMessage(aborted, FALLBACK)).toBe(FALLBACK);
  });

  it("never returns an empty string", () => {
    expect(toUserMessage(new Error(""), "")).not.toBe("");
  });

  it("the network message is in Spanish and tells the user what to do", () => {
    expect(NETWORK_ERROR_MESSAGE).toMatch(/conexión/i);
    expect(NETWORK_ERROR_MESSAGE).not.toMatch(/fetch|network|failed/i);
  });
});
