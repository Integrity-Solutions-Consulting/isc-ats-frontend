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
    <div className="w-full pt-5 pb-4 flex justify-center sticky top-0 z-40 px-4">
      <div className="bg-white/90 backdrop-blur-md border border-white/95 rounded-[100px] shadow-brand-md px-4 py-[5px] flex items-center gap-4">

        {/* Brand — "header" tone: dark text legible against the frosted white pill */}
        <Brand tone="header" subtitle="Mi Camello" />

        {portalHref ? (
          <>
            <div className="w-px h-8 bg-primary-800/10" />
            <Link
              href={portalHref}
              className="text-[13px] font-semibold text-white bg-primary-700 hover:bg-primary-600 rounded-[100px] px-[16px] py-[7px] transition-colors"
            >
              Ir a mi portal
            </Link>
          </>
        ) : (
          <>
            <div className="w-px h-8 bg-primary-800/10" />

            {/* Desktop: inline auth actions (secondary first, primary last) */}
            <div className="hidden items-center gap-2 sm:flex">
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
            </div>

            {/* Mobile: hamburger toggling the same actions */}
            <div ref={menuRef} className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menú"
                aria-expanded={open}
                className="flex h-9 w-9 items-center justify-center rounded-full text-primary-800 hover:bg-primary-700/[0.06] transition-colors"
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>

              {open && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-[180px] bg-white rounded-[14px] border border-primary-200 shadow-brand-lg overflow-hidden z-50">
                  <Link
                    href={ROUTES.login}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-[14px] font-semibold text-primary-800 hover:bg-primary-50 transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                  <div className="h-px bg-primary-200" />
                  <Link
                    href={ROUTES.registro}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-[14px] text-ink-muted hover:bg-primary-50 transition-colors"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
