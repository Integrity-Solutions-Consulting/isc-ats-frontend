'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Circle, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { cn } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';
import { PASSWORD_MIN_LENGTH, passwordPolicyError } from '@/shared/utils/ecuadorValidators';
import { LegalModal } from '@/features/legal/LegalModal';
import type { LegalDocId } from '@/features/legal/content';

const schema = z
  .object({
    email: z.string().trim().min(1, 'Ingresa tu correo').email('Correo no válido'),
    password: z.string().superRefine((value, ctx) => {
      const error = passwordPolicyError(value);
      if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    terms: z.literal(true, { message: 'Debes aceptar los términos' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// Live requirements checklist — mirrors the policy in ecuadorValidators.ts.
// Each rule ticks green as the user types, so the form tells them exactly what
// is still missing instead of a vague strength meter.
const PASSWORD_REQUIREMENTS: { label: string; test: (pw: string) => boolean }[] = [
  { label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { label: 'Una letra minúscula', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Una letra mayúscula', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Un número', test: (pw) => /\d/.test(pw) },
  { label: 'Un carácter especial', test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
];

export function RegistrationForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setSubmitError(resData.error || 'Error al registrar la cuenta');
        return;
      }
      // Account is created but unverified — send the user to the "check your
      // email" screen, not to login (login rejects unverified accounts).
      router.push(`${ROUTES.registroVerificacion}?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setSubmitError('No se pudo conectar con el servidor');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-ink">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Únete y encuentra tu próxima oportunidad
        </p>
      </div>

      {submitError && (
        <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
          {submitError}
        </div>
      )}


      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="reg-email">Correo electrónico</Label>
          <div className="relative">
            <Input
              id="reg-email"
              type="email"
              placeholder="tu@correo.com"
              aria-invalid={!!errors.email}
              className="pr-10"
              {...register('email')}
            />
            <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="reg-password">Contraseña</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPw ? 'text' : 'password'}
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
          {/* Live requirements checklist — replaces the strength bar */}
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
                    {met ? (
                      <Check className="size-3.5 shrink-0" />
                    ) : (
                      <Circle className="size-3.5 shrink-0" />
                    )}
                    {req.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="reg-confirm"
              type={showConfirm ? 'text' : 'password'}
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

        {/* Terms */}
        <div className="space-y-1">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-border accent-primary-600"
              {...register('terms')}
            />
            <span>
              Acepto los{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalDoc('terms');
                }}
                className="font-medium text-primary-600 hover:underline"
              >
                Términos y condiciones
              </button>
              {' '}y la{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLegalDoc('privacy');
                }}
                className="font-medium text-primary-600 hover:underline"
              >
                Política de privacidad
              </button>
            </span>
          </label>
          {errors.terms && <p className="text-xs text-danger">{errors.terms.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Crear cuenta
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          ¿Ya tienes cuenta?{' '}
          <Link href={ROUTES.login} className="font-medium text-primary-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
