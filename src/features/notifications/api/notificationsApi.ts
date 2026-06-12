import type { Notification } from '../types';

export async function listNotifications(): Promise<Notification[]> {
  const res = await fetch('/api/notifications', { cache: 'no-store' });
  if (res.ok) {
    const data = (await res.json()) as Notification[] | { error: string };
    if (Array.isArray(data)) return data;
  }
  return [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch('/api/notifications', { method: 'PATCH' });
}
