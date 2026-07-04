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
  mustChangePassword: boolean;
}

/** Parse the session-user cookie, failing safe to a profile-less candidate (least privilege). */
function parseSession(raw: string | undefined): SessionInfo {
  // missing → least privilege
  if (!raw) return { portal: "candidate", hasProfile: false, mustChangePassword: false };
  try {
    const parsed = JSON.parse(raw) as {
      portal?: string;
      has_profile?: boolean;
      must_change_password?: boolean;
    };
    return {
      portal: parsed.portal === "staff" ? "staff" : "candidate",
      hasProfile: parsed.has_profile === true,
      mustChangePassword: parsed.must_change_password === true,
    };
  } catch {
    // corrupt → least privilege
    return { portal: "candidate", hasProfile: false, mustChangePassword: false };
  }
}

// Rotation-race guard: parallel navigations (multiple tabs, prefetch, a page
// firing several sub-requests) each run this middleware and each carry the SAME
// rotating refresh token. The backend revokes the token on first use, so only
// the first POST succeeds and the rest get a 401 — bouncing an active user to
// /login mid-session. Coalescing concurrent refreshes for one token onto a
// single in-flight promise means the "losers" await the winner's result instead
// of racing a POST against an already-revoked token.
const refreshInFlight = new Map<string, Promise<AuthTokenPair | null>>();

/**
 * Exchange a refresh token for a fresh token pair. Returns null on any failure
 * (expired/revoked refresh token, backend unreachable) so the caller falls back
 * to the login redirect. Concurrent calls for the same refresh token share one
 * in-flight request to survive backend rotation-on-use races.
 */
function tryRefresh(
  refreshToken: string,
  request: NextRequest,
): Promise<AuthTokenPair | null> {
  const existing = refreshInFlight.get(refreshToken);
  if (existing) return existing;

  const flight = doRefresh(refreshToken, request).finally(() => {
    refreshInFlight.delete(refreshToken);
  });
  refreshInFlight.set(refreshToken, flight);
  return flight;
}

async function doRefresh(
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
  const isAuthGate = pathname === "/login" || pathname === "/registro" || pathname.startsWith("/registro/");
  // Password-recovery pages are used precisely when there is no session (forgot
  // your password / opening the emailed reset link), so they must stay reachable
  // to unauthenticated users. Omitting them made the "forgot password" link bounce
  // straight back to /login, looking dead.
  const isPasswordRecovery =
    pathname === "/recuperar-contrasena" || pathname === "/restablecer-contrasena";
  const isPublicPage =
    isAuthGate ||
    isPasswordRecovery ||
    pathname === "/empleos" ||
    pathname.startsWith("/empleos/");

  if (!isAuthenticated && !isPublicPage) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/empleos", request.url));
    }
    // Preserve the requested URL so LoginForm can send the user back after
    // authenticating (validated there via isSafeInternalPath/resolveReturnTo).
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated) {
    const rawSession = request.cookies.get("session-user")?.value;

    // Recovery: a valid (httpOnly) refresh token but NO session-user cookie means
    // we cannot know the user's portal. parseSession fails safe to "candidate",
    // which would wrongly funnel a STAFF user into candidate onboarding with no
    // way out. Rather than silently mis-route them, force a clean re-login so a
    // fresh session-user cookie is minted from the backend. Public pages are
    // exempt so an authenticated user browsing /empleos is not kicked out.
    if (!rawSession && !isPublicPage) {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("access-token");
      response.cookies.delete("refresh-token");
      response.cookies.delete("session-user");
      return response;
    }

    const { portal, hasProfile, mustChangePassword } = parseSession(rawSession);

    // Mandatory password change: an account provisioned with a temporary password
    // must set a new one before ANY portal access. This gate outranks portal
    // routing so no protected page renders first. The change-password page itself
    // stays reachable to avoid a redirect loop.
    const isChangePasswordPage = pathname === "/cambiar-contrasena";
    if (mustChangePassword && !isChangePasswordPage) {
      return finalize(NextResponse.redirect(new URL("/cambiar-contrasena", request.url)));
    }

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
