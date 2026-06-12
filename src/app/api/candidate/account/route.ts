import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendDelete } from "@/lib/backendFetch";

export async function DELETE() {
  try {
    await backendDelete("/auth/me");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Mirror the cookie-clearing logic from /api/auth/logout
  const response = NextResponse.json({ ok: true });
  const store = await cookies();
  // Read cookies here so Next.js can clear them on the response
  store.get("access-token");
  response.cookies.delete("access-token");
  response.cookies.delete("refresh-token");
  response.cookies.delete("session-user");
  return response;
}
