import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AuthLayout } from '@/design-system/templates/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Restablecer contraseña · Bolsa de Empleo',
};

// ResetPasswordForm reads useSearchParams (the token), which requires a Suspense
// boundary for static prerendering of this page.
export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
