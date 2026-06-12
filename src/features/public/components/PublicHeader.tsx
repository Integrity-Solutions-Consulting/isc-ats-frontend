import Link from 'next/link';

import { Brand } from '@/design-system/atoms/Brand';
import { ROUTES } from '@/shared/constants/routes';

interface PublicHeaderProps {
  /** When set, the visitor is authenticated. Shows "Ir a mi portal" pointing at
   * the correct portal home instead of the login/register pair. */
  portalHref?: string;
}

/**
 * Minimal public header shown on the anonymous job board pages.
 *
 * - Anonymous: secondary "Registrarse" link + primary "Iniciar sesión" button.
 * - Authenticated: single "Ir a mi portal" button linking to the user's portal.
 */
export function PublicHeader({ portalHref }: PublicHeaderProps) {
  return (
    <div className="w-full pt-5 pb-4 flex justify-center sticky top-0 z-40">
      <div className="bg-white/90 backdrop-blur-md border border-white/95 rounded-[100px] shadow-brand-md px-4 py-[5px] flex items-center gap-4">

        {/* Brand — "header" tone: dark text legible against the frosted white pill */}
        <Brand tone="header" subtitle="Mi Camello" />

        <div className="w-px h-8 bg-primary-800/10" />

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          {portalHref ? (
            <Link
              href={portalHref}
              className="text-[13px] font-semibold text-white bg-primary-700 hover:bg-primary-600 rounded-[100px] px-[16px] py-[7px] transition-colors"
            >
              Ir a mi portal
            </Link>
          ) : (
            <>
              {/* Secondary action first, primary last */}
              <Link
                href={ROUTES.registro}
                className="text-[13px] font-medium text-ink-muted hover:text-primary-700 rounded-[100px] px-[13px] py-[6px] transition-colors"
              >
                Registrarse
              </Link>
              <Link
                href={ROUTES.login}
                className="text-[13px] font-semibold text-white bg-primary-700 hover:bg-primary-600 rounded-[100px] px-[16px] py-[7px] transition-colors"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
