import type { AuthSession, LoginInput } from "../types";

/**
 * Login failure that carries the Route Handler's machine-readable `code`
 * alongside the message shown to the user. Lets callers react to a specific
 * cause (e.g. "email_not_verified" → offer to resend the link) without parsing
 * the Spanish copy.
 */
export class LoginError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "LoginError";
    this.code = code;
  }
}

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
    throw new LoginError(
      "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
    );
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };
    throw new LoginError(data.error ?? "No se pudo iniciar sesión", data.code);
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
