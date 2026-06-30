import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setAuthTokenCookies, type AuthTokenPair } from "@/lib/authCookies";

const BASE = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

// Single-flight refresh: a burst of parallel route-handler calls that all hit an
// expired access token must trigger ONE refresh, not one each — the backend
// rotates (revokes) the refresh token on use, so concurrent refreshes would race
// and all but the first would fail against an already-revoked token.
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Exchange the refresh-token cookie for a fresh token pair and persist it.
 * Returns the new access token, or null if there is no refresh token or the
 * backend rejects it. Cookie writes only succeed in writable contexts (route
 * handlers / server actions); in a server component the write throws and is
 * swallowed — the new token still serves the in-flight request.
 */
async function doRefresh(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get("refresh-token")?.value;
  if (!refreshToken) return null;

  let res: Response;
  try {
    res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const tokens = (await res.json()) as AuthTokenPair;
  try {
    setAuthTokenCookies(store, tokens);
  } catch {
    // Server-component context: cookies are read-only here. The token is still
    // returned for the current retry; the proxy persists rotation on navigation.
  }
  return tokens.access_token ?? null;
}

/**
 * A failed backend response, carrying its HTTP status and the human-readable
 * message the backend sent (FastAPI's `detail`). Route handlers re-raise the
 * real status and message instead of collapsing everything into a 500.
 *
 * `message` keeps the legacy `Backend <status> on <method> <path>: <body>` form
 * so older handlers that string-match on it (e.g. `includes("Backend 409")`)
 * keep working; `detail` holds the clean, user-facing text.
 */
export class BackendError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    message: string,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

/** Pull a readable message out of a FastAPI error body. */
function extractDetail(raw: string): string {
  try {
    const body = JSON.parse(raw) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const first = body.detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
  } catch {
    // not JSON — fall through to the raw text
  }
  return raw;
}

/**
 * Build a NextResponse from a thrown backend error for use in route-handler
 * catch blocks. A `BackendError` keeps its real status (e.g. 409) and message;
 * anything else becomes a generic 500. The message is exposed under both
 * `error` and `detail` so either client convention can read it.
 */
export function backendErrorResponse(error: unknown): NextResponse {
  if (error instanceof BackendError) {
    return NextResponse.json(
      { error: error.detail, detail: error.detail },
      { status: error.status },
    );
  }
  const message = error instanceof Error ? error.message : "Error";
  return NextResponse.json({ error: message, detail: message }, { status: 500 });
}

/**
 * Server-side fetch helper for Next.js route handlers and server components.
 * Reads the access-token httpOnly cookie and attaches it as Bearer auth.
 */
async function sendRequest<T>(
  path: string,
  method: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const store = await cookies();
  const token = store.get("access-token")?.value;

  const doFetch = (bearer: string | undefined) =>
    fetch(`${BASE}${path}`, {
      ...init,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });

  let res = await doFetch(token);

  // Access token expired → refresh once and retry. The 401 is raised at the
  // auth layer before the handler runs, so re-issuing the request is safe even
  // for writes. Never refresh-loop on the auth endpoints themselves.
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    const responseText = await res.text().catch(() => "");
    throw new BackendError(
      res.status,
      extractDetail(responseText),
      `Backend ${res.status} on ${method} ${path}: ${responseText}`,
    );
  }

  // Handle 204 No Content response
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export async function backendGet<T>(path: string, init?: RequestInit): Promise<T> {
  return sendRequest<T>(path, "GET", undefined, init);
}

export async function backendPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  return sendRequest<T>(path, "POST", body, init);
}

export async function backendPatch<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  return sendRequest<T>(path, "PATCH", body, init);
}

export async function backendDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return sendRequest<T>(path, "DELETE", undefined, init);
}

