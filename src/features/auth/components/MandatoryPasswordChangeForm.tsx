'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Circle, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { cn } from '@/shared/utils';
import { PASSWORD_REQUIREMENTS, passwordPolicyError } from '@/shared/utils/ecuadorValidators';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña temporal'),
    password: z.string().superRefine((value, ctx) => {
      const error = passwordPolicyError(value);
      if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((d) => d.password !== d.currentPassword, {
    message: 'La nueva contraseña debe ser distinta a la actual',
    path: ['password'],
  });

type FormValues = z.infer<typeof schema>;

/**
 * Mandatory password change for accounts provisioned with a temporary password
 * (backend `must_change_password`). The proxy funnels the user here and blocks
 * all portal access until the change succeeds. On success the backend revokes
 * the session, so we log out and send the user back to login to re-authenticate
 * with the new password (which arrives without the must-change flag set).
 */
export function MandatoryPasswordChangeForm() {
  const [showCurrent, setShowCurrent] = useState(false);
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
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.password,
        }),
      });
      if (!res.ok) {
        const resData = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitError(resData.error || 'No se pudo cambiar la contraseña');
        return;
      }
      // Backend revoked all sessions on the change. Clear cookies and re-login.
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      window.location.href = '/login?reset=true';
    } catch {
      setSubmitError('No se pudo conectar con el servidor');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-5">
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="size-5 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-ink">Cambia tu contraseña</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Por seguridad, debes reemplazar la contraseña temporal antes de continuar.
        </p>
      </div>

      {submitError && (
        <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Current (temporary) password */}
        <div className="space-y-1">
          <Label htmlFor="cp-current">Contraseña temporal</Label>
          <div className="relative">
            <Input
              id="cp-current"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.currentPassword}
              className="pr-10"
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-danger">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* New password */}
        <div className="space-y-1">
          <Label htmlFor="cp-password">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="cp-password"
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
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
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

        {/* Confirm new password */}
        <div className="space-y-1">
          <Label htmlFor="cp-confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="cp-confirm"
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
              Guardar y continuar
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
