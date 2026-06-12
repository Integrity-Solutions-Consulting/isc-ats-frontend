import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Parse the session-user cookie and return the portal value, failing safe to "candidate". */
function parsePortal(raw: string | undefined): "staff" | "candidate" {
  if (!raw) return "candidate"; // missing → least privilege
  try {
    const parsed = JSON.parse(raw) as { portal?: string };
    return parsed.portal === "staff" ? "staff" : "candidate";
  } catch {
    return "candidate"; // corrupt → least privilege
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
    const portal = parsePortal(rawSession);

    // Bounce authenticated users away from auth gates to their portal home.
    if (isAuthGate) {
      const destination = portal === "candidate" ? "/candidato/vacantes" : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // Portal isolation: candidates may only access /candidato/*, /empleos*.
    if (portal === "candidate") {
      const isCandidatePage =
        pathname.startsWith("/candidato/") ||
        pathname === "/empleos" ||
        pathname.startsWith("/empleos/");
      if (!isCandidatePage) {
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
