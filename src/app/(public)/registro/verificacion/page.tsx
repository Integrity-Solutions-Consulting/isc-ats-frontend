import type { Metadata } from 'next';
import { EmailVerificationPage } from '@/features/candidate-portal/components/EmailVerificationPage';

export const metadata: Metadata = {
  title: 'Verifica tu correo · Bolsa de Empleo',
};

export default function VerificationPage() {
  return <EmailVerificationPage />;
}
