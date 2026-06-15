import type { Metadata } from 'next';
import { EmailVerificationPage } from '@/features/candidate-portal/components/EmailVerificationPage';

export const metadata: Metadata = {
  title: 'Verifica tu correo · Bolsa de Empleo',
};

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <EmailVerificationPage email={email} />;
}
