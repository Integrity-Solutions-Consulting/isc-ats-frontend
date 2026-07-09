'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { Header } from '@/design-system/organisms/Header';
import { NotificationsPanel } from '@/features/notifications/components/NotificationsPanel';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { logout } from '@/features/auth/api/authApi';
import { ROUTES } from '@/shared/constants/routes';
import { PortalBreadcrumb } from './PortalBreadcrumb';

interface Props {
  user: { name: string; initials: string };
}

export function HeaderWithNotifications({ user }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifications } = useNotifications();
  const hasUnread = (notifications ?? []).some((n) => !n.read);

  const handleLogout = async () => {
    await logout();
    // Wipe the React Query cache so the next user who logs in on this browser
    // never sees the previous session's cached data (cross-account leak).
    queryClient.clear();
    router.push(ROUTES.login);
  };

  return (
    <Header
      user={user}
      profileHref={ROUTES.miPerfil}
      onLogout={handleLogout}
      breadcrumb={<PortalBreadcrumb />}
      hasUnread={hasUnread}
      onBellClick={() => setShowNotifications((v) => !v)}
      notificationsSlot={
        showNotifications ? (
          <NotificationsPanel onClose={() => setShowNotifications(false)} />
        ) : null
      }
      className="h-full"
    />
  );
}
