import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

function publicBase(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return new URL("/", request.url).origin;
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
