import type { Metadata } from 'next';
import { AuthLayout } from '@/design-system/templates/AuthLayout';
import { RegistrationForm } from '@/features/candidate-portal/components/RegistrationForm';

export const metadata: Metadata = {
  title: 'Crear cuenta · Bolsa de Empleo',
};

// Read the Turnstile site key at request time (server-side) so it comes from the
// runtime environment, not the build. This avoids relying on NEXT_PUBLIC_* being
// present during `next build` (it may only be injected at runtime by the host).
export const dynamic = 'force-dynamic';

export default function RegistrationPage() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
  return (
    <AuthLayout>
      <RegistrationForm turnstileSiteKey={turnstileSiteKey} />
    </AuthLayout>
  );
}
