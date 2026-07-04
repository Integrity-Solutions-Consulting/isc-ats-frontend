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

/** Build a request carrying the given cookies so we can exercise authenticated paths. */
function requestWith(pathname: string, cookies: Record<string, string>): NextRequest {
  const req = new NextRequest(new URL(pathname, "http://localhost:3000"));
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe("proxy — returnTo preservation on the login bounce", () => {
  it("appends the requested path (and query) as an encoded returnTo", async () => {
    const target = await redirectTarget("/candidato/vacantes?ref=email");
    expect(target).not.toBeNull();
    const url = new URL(target as string, "http://localhost:3000");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnTo")).toBe("/candidato/vacantes?ref=email");
  });

  it("does not add returnTo when redirecting the root to the public board", async () => {
    const target = await redirectTarget("/");
    expect(target).toContain("/empleos");
    expect(target).not.toContain("returnTo");
  });
});

describe("proxy — must_change_password gate", () => {
  const session = JSON.stringify({ portal: "staff", must_change_password: true });

  it("funnels a flagged user to /cambiar-contrasena from any portal page", async () => {
    const req = requestWith("/vacantes", {
      "access-token": "tok",
      "session-user": session,
    });
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/cambiar-contrasena");
  });

  it("lets the flagged user reach the change-password page itself (no loop)", async () => {
    const req = requestWith("/cambiar-contrasena", {
      "access-token": "tok",
      "session-user": session,
    });
    const res = await proxy(req);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy — missing session-user recovery", () => {
  it("forces a clean re-login when authenticated but session-user is absent", async () => {
    // A valid access token with no session-user cookie must not silently default a
    // staff user into candidate onboarding — force logout instead.
    const req = requestWith("/vacantes", { "access-token": "tok" });
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("does not kick an authenticated user off a public page for a missing cookie", async () => {
    const req = requestWith("/empleos", { "access-token": "tok" });
    const res = await proxy(req);
    expect(res.headers.get("location")).toBeNull();
  });
});
