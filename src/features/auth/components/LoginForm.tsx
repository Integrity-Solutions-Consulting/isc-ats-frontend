"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import Link from "next/link";

import { Button } from "@/design-system/ui/button";
import { Input } from "@/design-system/ui/input";
import { Label } from "@/design-system/ui/label";
import { Turnstile } from "@/design-system/molecules/Turnstile";
import { TurnstileNotice } from "@/design-system/molecules/TurnstileNotice";
import { login, LoginError } from "../api/authApi";
import { loginSchema, type LoginInput } from "../types";
import { ROUTES } from "@/shared/constants/routes";

// "Remember me" persists only the email — never the password. On the next visit
// the email is prefilled and the checkbox stays on, so the user just types the
// password. Clearing the checkbox on login forgets it.
const REMEMBERED_EMAIL_KEY = "isc.remembered_email";

// Seconds to wait between resend attempts. Matches EmailVerificationPage so the
// two entry points to the same endpoint behave identically.
const RESEND_COOLDOWN_SECONDS = 45;

interface LoginFormProps {
  /** Turnstile site key from the server env; empty string disables the widget. */
  turnstileSiteKey?: string;
}

export function LoginForm({ turnstileSiteKey = "" }: LoginFormProps) {
  const captchaEnabled = turnstileSiteKey.length > 0;
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Set only when login failed because the account is unverified. Holds the email
  // that failed so the resend action targets it even if the field is edited after.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  // Anti-bot token. `captchaKey` remounts the widget to mint a fresh token after
  // a failed attempt, since the token is single-use once the server verifies it.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: false },
  });

  // localStorage is client-only; read it after mount to avoid hydration mismatch.
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (remembered) {
      setValue("email", remembered);
      setValue("remember", true);
    }
  }, [setValue]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const passwordReset = searchParams.get("reset") === "true";
  const urlError = searchParams.get("error");
  const returnTo = searchParams.get("returnTo");

  /**
   * Only same-origin relative paths are safe redirect targets. Rejects absolute
   * URLs ("https://evil.com"), protocol-relative ("//evil.com") and backslash
   * tricks ("/\\evil.com") that browsers resolve as external navigations.
   */
  function isSafeInternalPath(to: string): boolean {
    return /^\/(?![/\\])/.test(to);
  }

  /**
   * Map a post-login returnTo URL to the correct destination.
   * Candidates who came from /empleos/{id} should land in the portal detail
   * for that same vacancy, not back on the public page. Unsafe or off-origin
   * values fall back to the portal home (open-redirect protection).
   */
  function resolveReturnTo(to: string, role: string): string {
    if (!isSafeInternalPath(to)) {
      return ROUTES.candidato.vacantes;
    }
    if (role === "candidate") {
      const publicVacancy = to.match(/^\/empleos\/([^/?#]+)(\/.*)?$/);
      if (publicVacancy) {
        return ROUTES.candidato.vacante(publicVacancy[1]);
      }
    }
    return to;
  }

  /**
   * Resend the verification link for an account that exists but was never
   * verified. Reaches the same endpoint as the post-registration screen, which
   * is otherwise unreachable once the user has left it — the reason someone
   * whose first link expired had no way out of this error.
   */
  async function handleResendVerification() {
    if (!unverifiedEmail) return;
    setResendError(null);
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setResendError(data.error ?? "No se pudo reenviar el correo");
        return;
      }
      setResent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendError("No se pudo conectar con el servidor");
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(values: LoginInput) {
    setAuthError(null);
    setUnverifiedEmail(null);
    setResent(false);
    setResendError(null);
    if (values.remember) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
    try {
      const session = await login(values, captchaToken);
      if (session.user.role === "candidate") {
        if (session.user.has_profile === false) {
          router.push(ROUTES.candidato.onboarding);
        } else if (returnTo) {
          router.push(resolveReturnTo(returnTo, "candidate"));
        } else {
          router.push(ROUTES.candidato.vacantes);
        }
      } else {
        router.push(ROUTES.dashboard);
      }
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "No se pudo iniciar sesión",
      );
      if (error instanceof LoginError && error.code === "email_not_verified") {
        setUnverifiedEmail(values.email);
      }
      // The token was consumed by the failed attempt — mint a fresh one.
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Bienvenido</h1>
      </div>

      {verified && (
        <div className="mb-4 rounded-lg bg-success/10 p-3 text-sm text-success border border-success/20">
          ¡Tu cuenta ha sido creada exitosamente! Ya puedes iniciar sesión.
        </div>
      )}
      {passwordReset && (
        <div className="mb-4 rounded-lg bg-success/10 p-3 text-sm text-success border border-success/20">
          Tu contraseña fue actualizada. Inicia sesión con la nueva.
        </div>
      )}
      {urlError && (
        <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
          {urlError === "invalid_token" || urlError === "missing_token"
            ? "El enlace de verificación es inválido o ha expirado."
            : "Hubo un problema al verificar tu correo."}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="tu@correo.com"
              aria-invalid={!!errors.email}
              className="pr-10"
              {...register("email")}
            />
            <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          </div>
          {errors.email && (
            <p className="text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle transition-colors hover:text-ink"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-ink-muted">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-primary-600"
              {...register("remember")}
            />
            Recordar mis datos
          </label>
          <Link href={ROUTES.recuperarContrasena} className="font-medium text-primary-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {captchaEnabled && (
          <Turnstile
            key={captchaKey}
            siteKey={turnstileSiteKey}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        )}

        {authError && (
          <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {authError}
            {unverifiedEmail && (
              <div className="mt-2 border-t border-danger/20 pt-2">
                {resent ? (
                  <p className="text-ink-muted">
                    Te enviamos un enlace nuevo a{" "}
                    <span className="font-medium text-ink">{unverifiedEmail}</span>. El
                    enlace vence en 24 horas.
                  </p>
                ) : (
                  <p className="text-ink-muted">
                    ¿El enlace venció o no lo encuentras? Podemos enviarte uno nuevo.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending || resendCooldown > 0}
                  className="mt-1 font-medium text-primary-600 hover:underline disabled:no-underline disabled:opacity-60"
                >
                  {resending
                    ? "Reenviando…"
                    : resendCooldown > 0
                      ? `Reenviar en 0:${String(resendCooldown).padStart(2, "0")}`
                      : resent
                        ? "Reenviar de nuevo"
                        : "Reenviar correo de verificación"}
                </button>
                {resendError && <p className="mt-1 text-danger">{resendError}</p>}
              </div>
            )}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || (captchaEnabled && !captchaToken)}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Iniciar sesión
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          ¿No tienes cuenta aún?{" "}
          <Link href={ROUTES.registro} className="font-medium text-primary-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>

        {captchaEnabled && <TurnstileNotice />}
      </form>
    </div>
  );
}
