import type { Metadata } from 'next';
import { AuthLayout } from '@/design-system/templates/AuthLayout';
import { RegistrationForm } from '@/features/candidate-portal/components/RegistrationForm';

export const metadata: Metadata = {
  title: 'Crear cuenta · Bolsa de Empleo',
};

// Read the Turnstile site key at request time (server-side) so it comes from the
// runtime environment, not the build. The key is passed down to the client as a
// prop, so it needs no NEXT_PUBLIC_ prefix — a plain server-only env var is read
// at runtime by the standalone server and never inlined at build.
export const dynamic = 'force-dynamic';

export default function RegistrationPage() {
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY ?? '';
  return (
    <AuthLayout>
      <RegistrationForm turnstileSiteKey={turnstileSiteKey} />
    </AuthLayout>
  );
}
