/**
 * Base URL for server-side self-calls to this app's own Route Handlers.
 *
 * In the browser, relative URLs work; on the server (RSC, Route Handlers)
 * fetch needs an absolute URL. NEXTJS_INTERNAL_URL must point at this
 * Next.js instance (e.g. http://frontend:3000 inside Docker).
 */
export const INTERNAL_BASE_URL =
  typeof window === "undefined"
    ? (process.env.NEXTJS_INTERNAL_URL ?? "http://localhost:3000")
    : "";
