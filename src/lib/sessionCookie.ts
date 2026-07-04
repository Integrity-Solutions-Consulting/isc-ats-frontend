import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

export interface SessionUserPayload {
  name: string;
  initials: string;
  portal: string;
  has_profile: boolean;
  /** Backend user id — used by the staff UI for self-protection (e.g. disabling deactivate on own row). */
  userId?: number;
  /**
   * Backend flag: the account was created/reset with a temporary password and
   * MUST change it before any portal access. Gated by the proxy so no protected
   * page renders until the password is changed.
   */
  must_change_password?: boolean;
}

const SESSION_USER_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — matches refresh-token lifetime

/**
 * Sets (or refreshes) the non-httpOnly `session-user` cookie on a response.
 * This is the single source of truth for the cookie's name, shape, encoding,
 * and flags — used by login and any route that needs to update the session.
 */
export function setSessionUserCookie(
  cookies: ResponseCookies,
  payload: SessionUserPayload,
): void {
  const isProd = process.env.NODE_ENV === "production";

  cookies.set("session-user", JSON.stringify(payload), {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_USER_MAX_AGE,
  });
}
