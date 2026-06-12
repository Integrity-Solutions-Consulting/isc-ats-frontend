import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get("refresh-token")?.value;

  if (refreshToken) {
    // Best-effort: revoke the refresh token on the backend.
    // We clear the cookies regardless of the outcome.
    await fetch(`${BACKEND}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => null);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("access-token");
  response.cookies.delete("refresh-token");
  response.cookies.delete("session-user");
  return response;
}
