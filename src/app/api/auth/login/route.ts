import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setSessionUserCookie } from "@/lib/sessionCookie";
import { setAuthTokenCookies } from "@/lib/authCookies";
import { clientIpHeader } from "@/lib/clientIp";

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
      headers: { "Content-Type": "application/json", ...clientIpHeader(request) },
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
    const detail = (data as { detail?: string }).detail ?? "";

    // Rate-limit / account lockout: surface the backend's Spanish message as-is
    // (it already explains the wait) and keep the 429 + Retry-After. Without this
    // a locked-out user would be wrongly told "Credenciales incorrectas".
    if (backendRes.status === 429) {
      const retryAfter = backendRes.headers.get("Retry-After");
      return NextResponse.json(
        { error: detail || "Demasiados intentos. Intentá nuevamente más tarde." },
        { status: 429, headers: retryAfter ? { "Retry-After": retryAfter } : undefined },
      );
    }

    const low = detail.toLowerCase();
    let errorMsg = "Credenciales incorrectas";
    if (low.includes("not verified") || low.includes("verify") || low.includes("verificado")) {
      errorMsg = "Tu correo no está verificado. Revisá tu bandeja de entrada y hacé clic en el enlace de confirmación.";
    } else if (low.includes("inactive") || low.includes("not active") || low.includes("disabled")) {
      errorMsg = "Tu cuenta no está activa. Contactá al soporte.";
    }
    return NextResponse.json(
      { error: errorMsg },
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

  setAuthTokenCookies(response.cookies, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
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
