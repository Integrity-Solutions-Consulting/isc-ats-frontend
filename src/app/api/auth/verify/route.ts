import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

/**
 * Trusted origin for absolute redirects. Never derived from client-controlled
 * forwarded-host/Host headers (open-redirect risk): those let an attacker point
 * the verification redirect at an external origin. Prefer a server-only
 * configured origin; otherwise fall back to the request's own resolved origin.
 */
function publicBase(request: NextRequest): string {
  return process.env.PUBLIC_APP_URL ?? request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const base = publicBase(request);

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", base));
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    return NextResponse.redirect(new URL("/login?error=connection_failed", base));
  }

  if (!backendRes.ok) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", base));
  }

  return NextResponse.redirect(new URL("/login?verified=true", base));
}
