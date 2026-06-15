import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

interface CandidateLayoutProps {
  children: React.ReactNode;
}

export function CandidateLayout({ children }: CandidateLayoutProps) {
  return (
    <div className="min-h-dvh bg-primary-50">
      {/* Scroll scrim: fades content into the background behind the floating header */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-28 bg-gradient-to-b from-primary-50 via-primary-50/85 to-transparent" />
      <TopNav />
      {/* Extra bottom padding on mobile so content clears the fixed BottomNav. */}
      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 md:pb-12">{children}</main>
      <BottomNav />
    </div>
  );
}
