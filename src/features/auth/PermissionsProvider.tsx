'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { PermissionCode } from './permissions';

interface PermissionsValue {
  /** True once the user's permissions were resolved. When false, gating is
   *  disabled (fail-open) so a transient fetch error never locks the portal —
   *  the backend still enforces every action. */
  loaded: boolean;
  has: (code: PermissionCode) => boolean;
}

const PermissionsContext = createContext<PermissionsValue>({
  loaded: false,
  has: () => true,
});

export function PermissionsProvider({
  codes,
  loaded,
  children,
}: {
  codes: string[];
  loaded: boolean;
  children: ReactNode;
}) {
  const value = useMemo<PermissionsValue>(() => {
    const set = new Set(codes);
    return { loaded, has: (code) => set.has(code) };
  }, [codes, loaded]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsValue {
  return useContext(PermissionsContext);
}
