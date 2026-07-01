import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

/** Location header set means the proxy issued a redirect; null means it passed the request through. */
async function redirectTarget(pathname: string): Promise<string | null> {
  // No auth cookies → the request is treated as unauthenticated.
  const request = new NextRequest(new URL(pathname, "http://localhost:3000"));
  const response = await proxy(request);
  return response.headers.get("location");
}

describe("proxy — public reachability of password-recovery pages", () => {
  it("lets an unauthenticated user reach /recuperar-contrasena", async () => {
    // The whole point of "forgot password" is that you have no session, so the
    // proxy must not bounce it to /login (which makes the link look dead).
    expect(await redirectTarget("/recuperar-contrasena")).toBeNull();
  });

  it("lets an unauthenticated user reach /restablecer-contrasena", async () => {
    // This is the page the emailed reset link opens — also always session-less.
    expect(await redirectTarget("/restablecer-contrasena")).toBeNull();
  });

  it("still bounces an unauthenticated user away from a protected page", async () => {
    // Regression guard: opening the recovery pages must not open the portal.
    const target = await redirectTarget("/candidato/vacantes");
    expect(target).not.toBeNull();
    expect(target).toContain("/login");
  });
});
