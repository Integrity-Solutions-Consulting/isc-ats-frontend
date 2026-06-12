"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import Link from "next/link";

import { Button } from "@/design-system/ui/button";
import { Input } from "@/design-system/ui/input";
import { Label } from "@/design-system/ui/label";
import { login } from "../api/authApi";
import { loginSchema, type LoginInput } from "../types";
import { ROUTES } from "@/shared/constants/routes";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const urlError = searchParams.get("error");
  const returnTo = searchParams.get("returnTo");

  /**
   * Map a post-login returnTo URL to the correct destination.
   * Candidates who came from /empleos/{id} should land in the portal detail
   * for that same vacancy, not back on the public page.
   * All other returnTo values pass through unchanged.
   */
  function resolveReturnTo(to: string, role: string): string {
    if (role === "candidate") {
      const publicVacancy = to.match(/^\/empleos\/([^/?#]+)(\/.*)?$/);
      if (publicVacancy) {
        return ROUTES.candidato.vacante(publicVacancy[1]);
      }
    }
    return to;
  }

  async function onSubmit(values: LoginInput) {
    setAuthError(null);
    try {
      const session = await login(values);
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
          <a href="#" className="font-medium text-primary-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {authError && (
          <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {authError}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
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
      </form>
    </div>
  );
}
