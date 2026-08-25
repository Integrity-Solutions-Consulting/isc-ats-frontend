import type { NextConfig } from "next";

// The dev server compiles modules through eval (HMR + source maps), so the
// enforced policy would break `next dev` without this escape hatch. Production
// never gets 'unsafe-eval'.
const isDev = process.env.NODE_ENV === "development";

// Cloudflare Turnstile needs this origin in THREE directives: it loads api.js
// (script-src), renders the challenge in an iframe (frame-src), and performs its
// own XHR back to Cloudflare (connect-src). It was missing from connect-src while
// the policy sat in Report-Only, so enforcing as-is would have killed login and
// registration for everyone.
const CF_TURNSTILE = "https://challenges.cloudflare.com";

// Enforced Content Security Policy. Scripts from unapproved origins, <base>
// hijacking, <object>/<embed>, framing and cross-origin form posts are all
// blocked outright.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // 'unsafe-inline' is a deliberate, documented tradeoff: Next.js injects inline
  // bootstrap/hydration scripts, and blocking those requires a per-request nonce,
  // which means middleware on every route and losing static prerendering. This
  // policy still blocks script injection from any origin we did not approve —
  // the bulk of real-world attacks — so it is a large net gain over the previous
  // Report-Only header, which enforced nothing and reported nowhere.
  // Promote to a nonce-based script-src when the dynamic-rendering cost is worth it.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${CF_TURNSTILE}`,
  `frame-src 'self' ${CF_TURNSTILE}`,
  `connect-src 'self' ${CF_TURNSTILE}`,
].join("; ");

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the production Docker image.
  output: "standalone",
  // Do not advertise the framework (was: X-Powered-By: Next.js).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
