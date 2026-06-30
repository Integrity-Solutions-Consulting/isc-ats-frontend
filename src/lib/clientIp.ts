/**
 * Header that forwards the real client IP to the backend so per-IP rate limits
 * key on the actual user, not on this Next.js proxy (the backend's only peer).
 *
 * Trusts a single reverse proxy in front of Next (Dokploy's Traefik), which
 * appends the connecting address to `X-Forwarded-For` — so the rightmost entry
 * is the real client, and a client-supplied value (prepended) is ignored. The
 * backend honours `X-Real-Client-IP` only when TRUST_PROXY_HEADERS is on, and
 * this proxy always sets it, so clients cannot spoof it end-to-end.
 *
 * Takes the base `Request` (not `NextRequest`) since it only reads a header, so
 * any route handler can pass its request regardless of the declared type.
 *
 * Returns an empty object when no forwarded IP is present (e.g. local dev), so
 * the backend falls back to the peer address.
 */
export function clientIpHeader(request: Request): Record<string, string> {
  const xff = request.headers.get("x-forwarded-for");
  if (!xff) return {};
  const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
  const realIp = parts[parts.length - 1];
  return realIp ? { "X-Real-Client-IP": realIp } : {};
}
