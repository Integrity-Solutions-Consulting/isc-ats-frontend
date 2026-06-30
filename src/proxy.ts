import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  setAuthTokenCookies,
  SESSION_USER_MAX_AGE,
  type AuthTokenPair,
} from "@/lib/authCookies";
import { clientIpHeader } from "@/lib/clientIp";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

interface SessionInfo {
  portal: "staff" | "candidate";
  hasProfile: boolean;
}

/** Parse the session-user cookie, failing safe to a profile-less candidate (least privilege). */
function parseSession(raw: string | undefined): SessionInfo {
  if (!raw) return { portal: "candidate", hasProfile: false }; // missing → least privilege
  try {
    const parsed = JSON.parse(raw) as { portal?: string; has_profile?: boolean };
    return {
      portal: parsed.portal === "staff" ? "staff" : "candidate",
      hasProfile: parsed.has_profile === true,
    };
  } catch {
    return { portal: "candidate", hasProfile: false }; // corrupt → least privilege
  }
}

/**
 * Exchange a refresh token for a fresh token pair. Returns null on any failure
 * (expired/revoked refresh token, backend unreachable) so the caller falls back
 * to the login redirect.
 */
async function tryRefresh(
  refreshToken: string,
  request: NextRequest,
): Promise<AuthTokenPair | null> {
  try {
    const res = await fetch(`${BACKEND}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeader(request) },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const tokens = (await res.json()) as AuthTokenPair;
    return tokens.access_token && tokens.refresh_token ? tokens : null;
  } catch {
    return null;
  }
}

// SECURITY NOTE: this middleware is a UX router, NOT a trust boundary. The
// `session-user` cookie is readable/forgeable by the client, so a tampered
// portal value can only change which UI a user is *routed* to — never what data
// they receive. Every protected resource is enforced server-side by the access
// token (httpOnly) against the backend's RBAC. Do not move real authorization
// decisions here.
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access-token")?.value;
  const refreshToken = request.cookies.get("refresh-token")?.value;
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === "production";

  // Transparent refresh: the access token expired (cookie gone) but the refresh
  // token is still alive. Renew silently so an active user is never bounced to
  // the login screen mid-session. The backend rotates the pair, so persist both.
  let refreshed: AuthTokenPair | null = null;
  if (!accessToken && refreshToken) {
    refreshed = await tryRefresh(refreshToken, request);
  }

  const isAuthenticated = Boolean(accessToken) || refreshed !== null;

  /** Attach the rotated token cookies (and slide the session window) to any response we return. */
  const finalize = (response: NextResponse): NextResponse => {
    if (refreshed) {
      setAuthTokenCookies(response.cookies, refreshed);
      // Keep the non-httpOnly session-user cookie alive alongside the refresh
      // token so an active user's UI session does not expire out from under them.
      const existing = request.cookies.get("session-user")?.value;
      if (existing) {
        response.cookies.set("session-user", existing, {
          httpOnly: false,
          secure: isProd,
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_USER_MAX_AGE,
        });
      }
    }
    return response;
  };

  // Auth gates bounce authenticated users to their portal; the public job
  // board stays reachable for everyone so the apply-after-login flow works.
  const isAuthGate = pathname === "/login" || pathname.startsWith("/registro");
  const isPublicPage =
    isAuthGate || pathname === "/empleos" || pathname.startsWith("/empleos/");

  if (!isAuthenticated && !isPublicPage) {
    const destination = pathname === "/" ? "/empleos" : "/login";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAuthenticated) {
    const rawSession = request.cookies.get("session-user")?.value;
    const { portal, hasProfile } = parseSession(rawSession);

    const isOnboarding = pathname === "/candidato/onboarding";

    // Bounce authenticated users away from auth gates to their portal home.
    // Candidates without a completed profile go straight to onboarding.
    if (isAuthGate) {
      const destination =
        portal === "candidate"
          ? hasProfile
            ? "/candidato/vacantes"
            : "/candidato/onboarding"
          : "/";
      return finalize(NextResponse.redirect(new URL(destination, request.url)));
    }

    // Portal isolation: candidates may only access /candidato/*, /empleos*.
    if (portal === "candidate") {
      const isCandidatePage =
        pathname.startsWith("/candidato/") ||
        pathname === "/empleos" ||
        pathname.startsWith("/empleos/");
      if (!isCandidatePage) {
        const destination = hasProfile ? "/candidato/vacantes" : "/candidato/onboarding";
        return finalize(NextResponse.redirect(new URL(destination, request.url)));
      }

      // Profile gate: an incomplete candidate is funneled to onboarding and kept
      // there until the profile exists. Onboarding itself is exempt to avoid a loop.
      if (!hasProfile && pathname.startsWith("/candidato/") && !isOnboarding) {
        return finalize(NextResponse.redirect(new URL("/candidato/onboarding", request.url)));
      }

      // A completed candidate has no reason to revisit onboarding.
      if (hasProfile && isOnboarding) {
        return finalize(NextResponse.redirect(new URL("/candidato/vacantes", request.url)));
      }
    }

    // Portal isolation: staff may not access the candidate portal.
    if (portal === "staff" && pathname.startsWith("/candidato/")) {
      return finalize(NextResponse.redirect(new URL("/", request.url)));
    }
  }

  return finalize(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|api).*)"],
};
