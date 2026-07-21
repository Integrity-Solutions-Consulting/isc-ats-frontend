'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

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
 *   On mobile these collapse behind a hamburger menu.
 * - Authenticated: single "Ir a mi portal" button linking to the user's portal.
 */
export function PublicHeader({ portalHref }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="w-full pt-5 pb-4 flex items-center justify-between sticky top-0 z-40 px-4 sm:justify-center">

      {/* Mobile: logo floats free at the left edge, no shared pill background —
          avoids the empty-looking gap a full-width bar left in the middle. */}
      <div className="sm:hidden">
        <Brand tone="header" subtitle="Mi Chamba" />
      </div>

      {/* Desktop: original centered floating pill, unchanged */}
      <div className="hidden items-center gap-4 rounded-[100px] border border-border/80 bg-card/90 px-4 py-[5px] shadow-brand-md backdrop-blur-md sm:flex">
        <Brand tone="header" subtitle="Mi Chamba" />

        {portalHref ? (
          <>
            <div className="w-px h-8 bg-border" />
            <Link
              href={portalHref}
              className="text-[13px] font-semibold text-white bg-primary-700 hover:bg-primary-600 rounded-[100px] px-[16px] py-[7px] transition-colors"
            >
              Ir a mi portal
            </Link>
          </>
        ) : (
          <>
            <div className="w-px h-8 bg-border" />
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

      {/* Mobile: right-edge action — its own floating control, not part of a bar */}
      <div className="sm:hidden">
        {portalHref ? (
          <Link
            href={portalHref}
            className="text-[13px] font-semibold text-white bg-primary-700 hover:bg-primary-600 rounded-[100px] px-[16px] py-[7px] transition-colors"
          >
            Ir a mi portal
          </Link>
        ) : (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menú"
              aria-expanded={open}
              className="flex h-9 w-9 items-center justify-center text-ink transition-colors"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            {open && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[180px] bg-card rounded-[14px] border border-border shadow-brand-lg overflow-hidden z-50">
                <Link
                  href={ROUTES.login}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-[14px] font-semibold text-ink hover:bg-surface-2 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <div className="h-px bg-border" />
                <Link
                  href={ROUTES.registro}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-[14px] text-ink-muted hover:bg-surface-2 transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
