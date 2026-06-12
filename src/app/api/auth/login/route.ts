import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setSessionUserCookie } from "@/lib/sessionCookie";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

function deriveDisplay(email: string): { name: string; initials: string } {
  const prefix = email.split("@")[0];
  const parts = prefix.split(/[._-]/);
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : prefix.slice(0, 2).toUpperCase();
  return { name, initials };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales incompletas" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor" },
      { status: 503 },
    );
  }

  if (!backendRes.ok) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (data as { detail?: string }).detail ?? "Credenciales incorrectas" },
      { status: backendRes.status === 401 ? 401 : 400 },
    );
  }

  const tokens = (await backendRes.json()) as {
    access_token: string;
    refresh_token: string;
    portal: string;
    must_change_password: boolean;
    has_profile: boolean;
  };

  const { name, initials } = deriveDisplay(email);
  const role = tokens.portal === "staff" ? ("hr_staff" as const) : ("candidate" as const);

  // Decode the access token to extract user id (sub claim). Safe: server-side only.
  let userId: number | undefined;
  try {
    const [, payloadB64] = tokens.access_token.split(".");
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as { sub?: string };
    if (decoded.sub) userId = parseInt(decoded.sub, 10);
  } catch {}

  const response = NextResponse.json({
    user: { name, initials, role, has_profile: tokens.has_profile },
  });

  const isProd = process.env.NODE_ENV === "production";
  const base = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };

  response.cookies.set("access-token", tokens.access_token, {
    ...base,
    maxAge: 60 * 30, // 30 min — matches backend ACCESS_TOKEN_EXPIRE_MINUTES
  });
  response.cookies.set("refresh-token", tokens.refresh_token, {
    ...base,
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches backend REFRESH_TOKEN_EXPIRE_DAYS
  });
  // Non-httpOnly: read client-side by layouts and components that need display info.
  setSessionUserCookie(response.cookies, {
    name,
    initials,
    portal: tokens.portal,
    has_profile: tokens.has_profile,
    userId,
  });

  return response;
}
