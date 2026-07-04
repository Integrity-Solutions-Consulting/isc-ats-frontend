import type { Metadata } from 'next';

import { AuthLayout } from '@/design-system/templates/AuthLayout';
import { MandatoryPasswordChangeForm } from '@/features/auth/components/MandatoryPasswordChangeForm';

export const metadata: Metadata = {
  title: 'Cambiar contraseña · Bolsa de Empleo',
};

// Mandatory-password-change gate. The proxy funnels accounts with a temporary
// password here and blocks all portal access until the change succeeds. It lives
// outside the portal route groups so no portal chrome renders behind the gate.
export default function ChangePasswordPage() {
  return (
    <AuthLayout>
      <MandatoryPasswordChangeForm />
    </AuthLayout>
  );
}
