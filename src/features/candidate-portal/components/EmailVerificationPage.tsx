'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import Link from 'next/link';

import { Brand } from '@/design-system/atoms/Brand';
import { Button } from '@/design-system/ui/button';
import { ROUTES } from '@/shared/constants/routes';

const RESEND_SECONDS = 45;

export function EmailVerificationPage({ email = 'tu@correo.com' }: { email?: string }) {
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const canResend = countdown <= 0;
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = () => {
    setResent(true);
    setCountdown(RESEND_SECONDS);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[520px] rounded-2xl border border-border bg-surface p-10 shadow-sm text-center">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-primary-100">
          <Mail className="size-9 text-primary-600" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-ink">Revisa tu correo</h1>
        <p className="mb-1 text-sm text-ink-muted">
          Enviamos un enlace de verificación a
        </p>
        <p className="mb-4 text-sm font-semibold text-ink">{email}</p>
        <p className="mb-8 text-sm text-ink-muted">
          Haz clic en el enlace para activar tu cuenta y comenzar a explorar vacantes.
        </p>

        <Link href={ROUTES.candidato.onboarding} className="block">
          <Button size="lg" className="w-full mb-4">
            Abrir correo
          </Button>
        </Link>

        <div className="mb-4 text-sm text-ink-muted">
          {resent ? (
            <span className="text-success font-medium">✓ Correo reenviado</span>
          ) : canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-primary-600 hover:underline"
            >
              Reenviar correo
            </button>
          ) : (
            <span>
              Reenviar en{' '}
              <span className="font-medium tabular-nums">
                0:{String(countdown).padStart(2, '0')}
              </span>
            </span>
          )}
        </div>

        <Link
          href={ROUTES.registro}
          className="text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ¿Correo incorrecto?{' '}
          <span className="font-medium text-primary-600 hover:underline">Volver al registro</span>
        </Link>
      </div>
    </div>
  );
}
