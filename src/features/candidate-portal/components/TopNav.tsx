'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, ChevronDown, LogOut, User, X } from 'lucide-react';
import { format, isAfter, isToday, isYesterday, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@/shared/utils';
import { Brand } from '@/design-system/atoms/Brand';
import { ROUTES } from '@/shared/constants/routes';
import { logout } from '@/features/auth/api/authApi';
import { getClientSessionUser } from '@/shared/constants/mockSession';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks/useNotifications';
import type { Notification } from '@/features/notifications/types';
import { getMyProfile } from '../api/candidateApi';

const NAV_LINKS = [
  { href: ROUTES.candidato.vacantes, label: 'Vacantes' },
  { href: ROUTES.candidato.misPostulaciones, label: 'Mis postulaciones' },
];

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const thisWeek: Notification[] = [];
  const older: Notification[] = [];

  for (const n of notifications) {
    const d = parseISO(n.createdAt);
    if (isToday(d)) today.push(n);
    else if (isYesterday(d)) yesterday.push(n);
    else if (isAfter(d, weekStart)) thisWeek.push(n);
    else older.push(n);
  }

  return [
    { label: 'Hoy', items: today },
    { label: 'Ayer', items: yesterday },
    { label: 'Esta semana', items: thisWeek },
    { label: 'Más antiguas', items: older },
  ].filter((g) => g.items.length > 0);
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();
  const [user, setUser] = useState<{ name: string; initials: string } | null>(null);

  useEffect(() => {
    // 1. Fallback to email-derived name from session cookie. Done post-mount on
    // purpose: the cookie is a client-only external source, and reading it during
    // render would cause a hydration mismatch (server has no access to it).
    const sessionUser = getClientSessionUser();
    if (sessionUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a client-only cookie, hydration-safe
      setUser(sessionUser);
    }

    // 2. Fetch actual candidate profile details if they exist
    getMyProfile().then((profile) => {
      if (profile && profile.firstName) {
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        const initials = (profile.firstName.charAt(0) + (profile.lastName?.charAt(0) || '')).toUpperCase();
        setUser({ name: fullName, initials });
      }
    }).catch((err) => {
      console.error('Failed to load dynamic profile in TopNav', err);
    });
  }, []);

  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(avatarRef, () => setShowAvatar(false));

  const unreadCount = notifications.filter((n) => !n.read).length;
  const groups = groupByDate(notifications);

  const markAllRead = () => markAllReadMutation.mutate();
  const markRead = (id: string) => markReadMutation.mutate(id);

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.login);
  };

  return (
    <div className="w-full pt-5 pb-4 flex justify-center sticky top-0 z-40">
      <div className="bg-white/90 backdrop-blur-md border border-white/95 rounded-[100px] shadow-brand-md px-2 py-[5px] pl-4 flex items-center gap-3">

        {/* Logo — same corporate lockup as the public header */}
        <div className="shrink-0">
          <Brand tone="header" subtitle="Mi Camello" />
        </div>

        {/* Divider + inline nav: desktop only. On mobile these live in BottomNav. */}
        <div className="hidden w-px h-8 bg-primary-800/10 md:block" />

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'text-[13px] font-medium rounded-[100px] px-[13px] py-[6px] transition-colors',
                  isActive
                    ? 'bg-primary-700/8 text-primary-700'
                    : 'text-ink-muted hover:text-primary-700',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="w-px h-8 bg-primary-800/10" />

        {/* Bell + Avatar */}
        <div className="flex items-center gap-2">

          {/* Bell */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => { setShowNotifications((v) => !v); setShowAvatar(false); }}
              className="relative p-1.5 text-ink-muted hover:opacity-80 transition-opacity"
              aria-label="Notificaciones"
            >
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[calc(100vw-2rem)] max-w-[360px] bg-white/95 backdrop-blur-md rounded-xl border border-primary-200 shadow-brand-lg overflow-hidden z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-primary-200">
                  <span className="text-[15px] font-bold text-primary-800">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                      {unreadCount}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={markAllRead}
                      title="Marcar todas como leídas"
                      className="flex items-center justify-center w-7 h-7 rounded-md text-primary-700 hover:bg-primary-50 transition-colors"
                    >
                      <CheckCheck size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-ink-muted hover:bg-primary-50 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Grouped list */}
                <div className="max-h-[360px] overflow-y-auto">
                  {groups.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-ink-muted">Sin notificaciones.</p>
                  ) : groups.map((group) => (
                    <div key={group.label}>
                      <p className="sticky top-0 bg-surface-2 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                        {group.label}
                      </p>
                      {group.items.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markRead(n.id)}
                          className={cn(
                            'flex w-full items-start gap-3 border-b border-primary-200 px-4 py-3 text-left transition-colors last:border-0 hover:bg-primary-50',
                            n.read ? 'bg-white/50' : 'bg-primary-50',
                          )}
                        >
                          {!n.read
                            ? <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-primary-700" />
                            : <Check size={15} className="mt-1 shrink-0 text-success" />
                          }
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-[13px]', !n.read ? 'font-semibold text-primary-800' : 'text-ink-muted')}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-[12px] text-ink-muted leading-snug">{n.body}</p>
                            <p className="mt-1 text-[11px] text-ink-muted">
                              {format(parseISO(n.createdAt), "d MMM 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-primary-200 px-4 py-2.5 text-center">
                  <p className="text-[12px] text-primary-700">
                    {notifications.length} notificaci{notifications.length !== 1 ? 'ones' : 'ón'} en total
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar chip */}
          <div ref={avatarRef} className="relative">
            <button
              type="button"
              onClick={() => { setShowAvatar((v) => !v); setShowNotifications(false); }}
              className="flex items-center gap-2 bg-primary-700/[0.06] rounded-[100px] px-3 py-1.5 hover:bg-primary-700/10 transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-700 text-[11px] font-semibold text-white select-none">
                {user?.initials ?? 'C'}
              </span>
              <span className="text-[13px] font-medium text-primary-800 hidden sm:block">{user?.name ?? 'Candidato'}</span>
              <ChevronDown size={14} className={cn('text-ink-muted transition-transform', showAvatar && 'rotate-180')} />
            </button>

            {showAvatar && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[200px] bg-white rounded-[10px] border border-primary-200 shadow-brand-sm overflow-hidden z-50">
                <Link
                  href={ROUTES.candidato.miPerfil}
                  onClick={() => setShowAvatar(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors text-left"
                >
                  <User size={16} className="text-primary-700" />
                  <span className="text-[14px] text-primary-800">Mi perfil</span>
                </Link>
                <div className="h-px bg-primary-200" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-danger/5 transition-colors text-left"
                >
                  <LogOut size={16} className="text-danger" />
                  <span className="text-[14px] text-danger">Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
