import { TopNav } from './TopNav';

interface CandidateLayoutProps {
  children: React.ReactNode;
}

export function CandidateLayout({ children }: CandidateLayoutProps) {
  return (
    <div className="min-h-dvh bg-primary-50">
      <TopNav />
      <main className="mx-auto max-w-7xl px-6 pb-12">{children}</main>
    </div>
  );
}
