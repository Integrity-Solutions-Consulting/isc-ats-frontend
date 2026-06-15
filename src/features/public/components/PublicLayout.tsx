import { PublicHeader } from './PublicHeader';

interface PublicLayoutProps {
  children: React.ReactNode;
  /** Pass the portal home URL when the visitor is authenticated so the header
   * can show "Ir a mi portal" instead of the login/register pair. */
  portalHref?: string;
}

export function PublicLayout({ children, portalHref }: PublicLayoutProps) {
  return (
    <div className="min-h-dvh bg-primary-50">
      {/* Scroll scrim: fades content into the background behind the floating header */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-28 bg-gradient-to-b from-primary-50 via-primary-50/85 to-transparent" />
      <PublicHeader portalHref={portalHref} />
      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">{children}</main>
    </div>
  );
}
