/**
 * Turns any thrown value into text that is safe to put on screen.
 *
 * The API helpers in this codebase throw `new Error(detail)`, where `detail` is
 * the backend's own Spanish message — that text is written for the user and is
 * worth keeping. What must never reach the screen is the browser's failure text
 * ("Failed to fetch", "Load failed", "NetworkError ..."), which is English and
 * tells the user nothing about what to do.
 *
 * Use this in every `catch` that feeds a visible error state, instead of passing
 * `err.message` through directly.
 */

export const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.";

/**
 * Failure text produced by the browser itself, not by our API. Lowercased
 * fragments — Chrome, Firefox and Safari each word this differently.
 */
const BROWSER_NETWORK_FRAGMENTS = [
  "failed to fetch",
  "networkerror",
  "load failed",
  "network request failed",
  "connection appears to be offline",
  "err_internet_disconnected",
];

export function toUserMessage(error: unknown, fallback: string): string {
  const safeFallback = fallback.trim() || NETWORK_ERROR_MESSAGE;

  if (!(error instanceof Error)) return safeFallback;

  // An aborted request is not a failure the user caused or needs explained.
  if (error.name === "AbortError") return safeFallback;

  const message = error.message.trim();
  if (!message) return safeFallback;

  const lower = message.toLowerCase();
  if (BROWSER_NETWORK_FRAGMENTS.some((fragment) => lower.includes(fragment))) {
    return NETWORK_ERROR_MESSAGE;
  }

  return message;
}
