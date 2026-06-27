/**
 * Cookie-consent state — stored per browser in localStorage, NOT in the database
 * (the notice is shown to anonymous visitors before login; consent is per-device).
 *
 * Today the app sets ONLY strictly-necessary cookies (auth + session display),
 * which are exempt from prior consent, so this is an informational notice, not a
 * granular opt-in manager.
 *
 * EXTENSION POINT — when non-essential cookies (analytics, marketing) are added:
 *   1. Bump the version in CONSENT_KEY (e.g. v2). That alone forces every visitor
 *      to see the notice again and re-acknowledge — the real safeguard against a
 *      stale consent record.
 *   2. Replace the boolean acknowledgment with a per-category preference object,
 *      and gate each non-essential script on the stored preference (do NOT load
 *      the script until its category is accepted).
 *
 * Exposed as a useSyncExternalStore-compatible store so the banner can read it
 * without a setState-in-effect (forbidden by the project's React Compiler rules)
 * and without an SSR hydration mismatch.
 */

const CONSENT_KEY = 'cookie-consent-v1';
const ACKNOWLEDGED = 'acknowledged';

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === ACKNOWLEDGED;
  } catch {
    // localStorage blocked (private mode, etc.) — treat as not acknowledged.
    return false;
  }
}

/** Record that the visitor saw the notice. Notifies subscribers in this tab. */
export function acknowledgeCookies(): void {
  try {
    localStorage.setItem(CONSENT_KEY, ACKNOWLEDGED);
  } catch {
    // Storage unavailable — the banner simply reappears next visit. The cookies
    // are strictly necessary regardless, so nothing breaks.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCookieConsent(listener: Listener): () => void {
  listeners.add(listener);
  // Cross-tab sync: reflect an acknowledgment made in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getCookieConsentSnapshot(): boolean {
  return read();
}

/**
 * Server (and first hydration) snapshot: report "acknowledged" so the banner is
 * never server-rendered. This avoids a flash on every SSR page and a hydration
 * mismatch; the client snapshot then reveals the banner when truly pending.
 */
export function getCookieConsentServerSnapshot(): boolean {
  return true;
}
