import { CandidateLayout } from '@/features/candidate-portal/components/CandidateLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CandidateLayout>{children}</CandidateLayout>;
}
