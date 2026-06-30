'use client';

import { usePathname } from 'next/navigation';

import { permissionForPath } from '@/features/auth/permissions';
import { usePermissions } from '@/features/auth/PermissionsProvider';
import { AccessDenied } from './AccessDenied';

/**
 * Route-level permission gate for direct-URL access. Mirrors the sidebar
 * filtering: if the current path needs a permission the user lacks, the page is
 * replaced with the AccessDenied screen instead of a broken view.
 *
 * Fails open until permissions resolve (the backend stays the real boundary).
 */
export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loaded, has } = usePermissions();

  const required = permissionForPath(pathname);
  if (loaded && required && !has(required)) {
    return <AccessDenied />;
  }
  return <>{children}</>;
}
