import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

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
  body?: any,
  init?: RequestInit,
): Promise<T> {
  const store = await cookies();
  const token = store.get("access-token")?.value;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

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

export async function backendPost<T>(path: string, body: any, init?: RequestInit): Promise<T> {
  return sendRequest<T>(path, "POST", body, init);
}

export async function backendPatch<T>(path: string, body: any, init?: RequestInit): Promise<T> {
  return sendRequest<T>(path, "PATCH", body, init);
}

export async function backendDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return sendRequest<T>(path, "DELETE", undefined, init);
}

