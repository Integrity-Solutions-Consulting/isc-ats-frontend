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
      <PublicHeader portalHref={portalHref} />
      <main className="mx-auto max-w-7xl px-6 pb-12">{children}</main>
    </div>
  );
}
