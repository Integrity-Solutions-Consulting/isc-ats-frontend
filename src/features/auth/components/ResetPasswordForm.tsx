'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Circle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { cn } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';
import { PASSWORD_REQUIREMENTS, passwordPolicyError } from '@/shared/utils/ecuadorValidators';

const schema = z
  .object({
    password: z.string().superRefine((value, ctx) => {
      const error = passwordPolicyError(value);
      if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onTouched' });

  const passwordValue = watch('password', '');
  const confirmValue = watch('confirmPassword', '');
  const confirmMatch = confirmValue.length > 0 && confirmValue === passwordValue;

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      if (!res.ok) {
        const resData = await res.json().catch(() => ({}));
        setSubmitError(resData.error || 'No se pudo restablecer la contraseña');
        return;
      }
      // Password changed — all sessions were revoked server-side; send them to
      // login with a success banner.
      router.push(`${ROUTES.login}?reset=true`);
    } catch {
      setSubmitError('No se pudo conectar con el servidor');
    }
  }

  // A missing token means the user opened the page without a valid email link.
  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-ink">Enlace no válido</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Este enlace de restablecimiento es inválido o está incompleto. Solicita uno nuevo.
        </p>
        <Link
          href={ROUTES.recuperarContrasena}
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Solicitar un nuevo enlace
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-ink">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-ink-muted">Elige una contraseña segura para tu cuenta.</p>
      </div>

      {submitError && (
        <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
          {submitError}{' '}
          <Link href={ROUTES.recuperarContrasena} className="font-medium underline">
            Solicitar un nuevo enlace
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="rp-password">Contraseña</Label>
          <div className="relative">
            <Input
              id="rp-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Ocultar' : 'Mostrar'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {passwordValue.length > 0 && (
            <ul className="space-y-1 pt-0.5">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(passwordValue);
                return (
                  <li
                    key={req.label}
                    className={cn(
                      'flex items-center gap-1.5 text-xs transition-colors',
                      met ? 'text-success' : 'text-ink-subtle',
                    )}
                  >
                    {met ? <Check className="size-3.5 shrink-0" /> : <Circle className="size-3.5 shrink-0" />}
                    {req.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <Label htmlFor="rp-confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="rp-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              className={cn('pr-10', confirmMatch && 'border-success focus-visible:ring-success/30')}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
          )}
          {confirmMatch && <p className="text-xs text-success">✓ Las contraseñas coinciden</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Restablecer contraseña
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <Link
          href={ROUTES.login}
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesión
        </Link>
      </form>
    </div>
  );
}
