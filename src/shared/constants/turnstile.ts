/**
 * Cloudflare Turnstile site key (public by design — safe to ship to the browser).
 * Set NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable the anti-bot widget on the login
 * and registration forms. When empty, the widget is not rendered and the forms
 * submit without a token — the backend also has the gate disabled in that case.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** True when a site key is configured, so the widget should be rendered/enforced. */
export const isTurnstileEnabled = TURNSTILE_SITE_KEY.length > 0;
