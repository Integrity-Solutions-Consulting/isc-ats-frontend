import { cookies } from "next/headers";

const BASE = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

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
    throw new Error(`Backend ${res.status} on ${method} ${path}: ${responseText}`);
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

