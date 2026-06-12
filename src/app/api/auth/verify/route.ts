import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    return NextResponse.redirect(new URL("/login?error=connection_failed", request.url));
  }

  if (!backendRes.ok) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  return NextResponse.redirect(new URL("/login?verified=true", request.url));
}
