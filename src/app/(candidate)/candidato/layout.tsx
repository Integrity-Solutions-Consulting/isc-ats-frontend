import type { Metadata } from 'next';
import { CandidateLayout } from '@/features/candidate-portal/components/CandidateLayout';

export const metadata: Metadata = {
  title: 'Bolsa de Empleo',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CandidateLayout>{children}</CandidateLayout>;
}
