import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Per-request cookie store, switched by the test before each call so we can
// simulate two concurrent users (A and B) hitting refresh at the same time.
let currentRefreshToken: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "refresh-token" && currentRefreshToken
        ? { value: currentRefreshToken }
        : name === "access-token"
          ? { value: "expired-access" }
          : undefined,
    set: () => {},
  }),
}));

vi.mock("@/lib/authCookies", () => ({
  setAuthTokenCookies: () => {},
}));

import { backendGet } from "./backendFetch";

describe("backendFetch — refresh single-flight is keyed per refresh token", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    currentRefreshToken = undefined;
  });

  it("never hands user B an access token minted from user A's refresh token", async () => {
    // The backend mints an access token derived from whichever refresh token was
    // presented. Every protected GET first 401s (expired access), then refreshes.
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith("/auth/refresh")) {
        const body = JSON.parse(String(init?.body)) as { refresh_token: string };
        // Access token is bound to the presented refresh token.
        return new Response(
          JSON.stringify({
            access_token: `access-for-${body.refresh_token}`,
            refresh_token: `rotated-${body.refresh_token}`,
          }),
          { status: 200 },
        );
      }
      // Protected resource: 401 while carrying the "expired" access token, 200
      // once a refreshed token is presented. Echo back which token was used.
      const auth = (init?.headers as Record<string, string>)?.Authorization ?? "";
      if (auth.includes("expired-access")) {
        return new Response("unauthorized", { status: 401 });
      }
      return new Response(JSON.stringify({ usedAuth: auth }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    // User A refreshes.
    currentRefreshToken = "refresh-A";
    const resA = (await backendGet<{ usedAuth: string }>("/some/resource")) as {
      usedAuth: string;
    };

    // User B refreshes with a DIFFERENT refresh token.
    currentRefreshToken = "refresh-B";
    const resB = (await backendGet<{ usedAuth: string }>("/some/resource")) as {
      usedAuth: string;
    };

    expect(resA.usedAuth).toContain("access-for-refresh-A");
    expect(resB.usedAuth).toContain("access-for-refresh-B");
    // The critical assertion: B must NOT receive A's token.
    expect(resB.usedAuth).not.toContain("refresh-A");

    vi.unstubAllGlobals();
  });
});
