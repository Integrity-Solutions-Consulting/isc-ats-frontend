'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Label } from '@/design-system/ui/label';
import { ROUTES } from '@/shared/constants/routes';

const schema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo').email('Correo no válido'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  // The success state is shown for ANY valid submission, even when the email is
  // not registered — the API answers generically (anti-enumeration) and the UI
  // must not leak whether an account exists.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onTouched' });

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) {
        const resData = await res.json().catch(() => ({}));
        setSubmitError(resData.error || 'No se pudo procesar la solicitud');
        return;
      }
      setSentTo(data.email);
    } catch {
      setSubmitError('No se pudo conectar con el servidor');
    }
  }

  if (sentTo) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="size-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-ink">Revisa tu correo</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Si <span className="font-semibold text-ink">{sentTo}</span> está registrado,
          te enviamos un enlace para restablecer tu contraseña. El enlace vence en 1 hora.
        </p>
        <Link
          href={ROUTES.login}
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva.
        </p>
      </div>

      {submitError && (
        <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="fp-email">Correo electrónico</Label>
          <div className="relative">
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              aria-invalid={!!errors.email}
              className="pr-10"
              {...register('email')}
            />
            <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Enviar enlace
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
