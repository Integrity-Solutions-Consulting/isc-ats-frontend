'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notifications } = useNotifications();
  const hasUnread = (notifications ?? []).some((n) => !n.read);

  const handleLogout = async () => {
    await logout();
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
