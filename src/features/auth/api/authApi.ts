import type { AuthSession, LoginInput } from "../types";

/**
 * Auth client — calls the Next.js Route Handler which owns the httpOnly cookie.
 * When FastAPI is ready, update the Route Handler (app/api/auth/login/route.ts),
 * not this file.
 */
export async function login(
  credentials: LoginInput,
  turnstileToken?: string | null,
): Promise<AuthSession> {
  let res: Response;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...credentials, turnstile_token: turnstileToken }),
    });
  } catch {
    // Network-level failure (offline, server unreachable, dropped connection).
    // Never surface the raw browser "Failed to fetch" — keep the UI Spanish-only.
    throw new Error(
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
    );
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "No se pudo iniciar sesión",
    );
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
