import type { Metadata } from 'next';
import { AuthLayout } from '@/design-system/templates/AuthLayout';
import { RegistrationForm } from '@/features/candidate-portal/components/RegistrationForm';

export const metadata: Metadata = {
  title: 'Crear cuenta · Bolsa de Empleo',
};

export default function RegistrationPage() {
  return (
    <AuthLayout>
      <RegistrationForm />
    </AuthLayout>
  );
}
