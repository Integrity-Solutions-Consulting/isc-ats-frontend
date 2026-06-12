/**
 * Client-side helper to read the non-httpOnly session-user cookie.
 * Populated by the login route handler after a successful authentication.
 *
 * Use this only in Client Components that need display info (name, initials).
 * Server Components should use `cookies()` from `next/headers` directly.
 */
export function getClientSessionUser(): { name: string; initials: string } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)session-user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as { name: string; initials: string };
  } catch {
    return null;
  }
}
