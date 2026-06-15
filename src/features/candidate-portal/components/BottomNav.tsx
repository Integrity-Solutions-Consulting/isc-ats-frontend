'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, ClipboardList } from 'lucide-react';

import { cn } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';

const TABS = [
  { href: ROUTES.candidato.vacantes, label: 'Vacantes', icon: Briefcase },
  { href: ROUTES.candidato.misPostulaciones, label: 'Mis postulaciones', icon: ClipboardList },
];

/**
 * Fixed bottom tab bar for the candidate portal on mobile (thumb reach).
 * Hidden from md+ where TopNav shows the inline nav links instead.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navegación principal"
    >
      <ul className="flex items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary-700' : 'text-ink-muted',
                )}
              >
                <Icon size={22} strokeWidth={2} />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
