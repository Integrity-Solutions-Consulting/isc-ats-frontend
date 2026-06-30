/**
 * Single source of truth for the auth token cookies (`access-token`,
 * `refresh-token`). Used by login, the proxy (navigation refresh) and
 * backendFetch (API refresh-on-401) so names, flags and lifetimes never drift.
 */

export const ACCESS_TOKEN_MAX_AGE = 60 * 30; // 30 min — matches backend ACCESS_TOKEN_EXPIRE_MINUTES
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — matches backend REFRESH_TOKEN_EXPIRE_DAYS
export const SESSION_USER_MAX_AGE = REFRESH_TOKEN_MAX_AGE;

/** Tokens returned by the backend on login and on refresh (rotated pair). */
export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
}

/** Minimal cookie-jar shape shared by NextResponse.cookies and the next/headers store. */
export interface CookieSetter {
  set(
    name: string,
    value: string,
    options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
      path?: string;
      maxAge?: number;
    },
  ): void;
}

function tokenCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Writes the access + refresh token cookies. The backend rotates the refresh
 * token on every refresh, so the new refresh token MUST always be persisted or
 * the next refresh fails against a revoked token.
 */
export function setAuthTokenCookies(
  cookies: CookieSetter,
  tokens: AuthTokenPair,
): void {
  cookies.set("access-token", tokens.access_token, tokenCookieOptions(ACCESS_TOKEN_MAX_AGE));
  cookies.set("refresh-token", tokens.refresh_token, tokenCookieOptions(REFRESH_TOKEN_MAX_AGE));
}
