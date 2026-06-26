'use client';

import { X, CheckCheck, Check } from 'lucide-react';
import { format, isToday, isYesterday, parseISO, startOfWeek, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/design-system/ui/button';
import { cn } from '@/shared/utils';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/useNotifications';
import type { Notification } from '../types';

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

interface Props { onClose: () => void; }

export function NotificationsPanel({ onClose }: Props) {
  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unread = notifications.filter((n) => !n.read).length;
  const groups = groupByDate(notifications);

  const markRead = (id: string) => markReadMutation.mutate(id);
  const markAllRead = () => markAllReadMutation.mutate();

  return (
    <div className="absolute right-4 top-16 z-50 flex w-96 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="font-semibold text-ink">Notificaciones</span>
        {unread > 0 && (
          <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Marcar todas como leídas" className="size-8" onClick={markAllRead}>
            <CheckCheck className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cerrar notificaciones" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[440px] overflow-y-auto">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-ink-subtle">Cargando notificaciones…</p>
        ) : groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-subtle">Sin notificaciones.</p>
        ) : groups.map((group) => (
          <div key={group.label}>
            <p className="sticky top-0 bg-surface-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {group.label}
            </p>
            {group.items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-primary-50/40',
                  !n.read && 'bg-primary-50',
                )}
              >
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-danger" />}
                {n.read && <Check className="mt-1 size-4 shrink-0 text-success" />}
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', !n.read ? 'font-semibold text-ink' : 'text-ink-muted')}>{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {format(parseISO(n.createdAt), "d MMM 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer — counts only unread, so it clears as the user reads. */}
      <div className="border-t border-border px-4 py-2.5 text-center">
        <p className="text-xs text-ink-subtle">
          {unread === 0
            ? 'No tienes notificaciones sin leer'
            : `${unread} notificación${unread !== 1 ? 'es' : ''} sin leer`}
        </p>
      </div>
    </div>
  );
}
