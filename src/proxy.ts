import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access-token");
  const { pathname } = request.nextUrl;

  const isAuthenticated = Boolean(token?.value);
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
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // Portal isolation: candidates may only access /candidato/*, /empleos*.
    if (portal === "candidate") {
      const isCandidatePage =
        pathname.startsWith("/candidato/") ||
        pathname === "/empleos" ||
        pathname.startsWith("/empleos/");
      if (!isCandidatePage) {
        const destination = hasProfile ? "/candidato/vacantes" : "/candidato/onboarding";
        return NextResponse.redirect(new URL(destination, request.url));
      }

      // Profile gate: an incomplete candidate is funneled to onboarding and kept
      // there until the profile exists. Onboarding itself is exempt to avoid a loop.
      if (!hasProfile && pathname.startsWith("/candidato/") && !isOnboarding) {
        return NextResponse.redirect(new URL("/candidato/onboarding", request.url));
      }

      // A completed candidate has no reason to revisit onboarding.
      if (hasProfile && isOnboarding) {
        return NextResponse.redirect(new URL("/candidato/vacantes", request.url));
      }
    }

    // Portal isolation: staff may not access the candidate portal.
    if (portal === "staff" && pathname.startsWith("/candidato/")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|api).*)"],
};
