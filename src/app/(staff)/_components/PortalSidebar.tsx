"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { Sidebar } from "@/design-system/organisms/Sidebar";
import { PORTAL_NAV } from "@/shared/constants/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { usePermissions } from "@/features/auth/PermissionsProvider";

/**
 * Client wrapper that binds the portal navigation (which carries icon
 * components) to the generic Sidebar. Keeping this on the client avoids
 * passing function components across the server/client boundary.
 *
 * Navigation policy lives here, not in the design-system: candidate profiles
 * opened from the talent pool keep "Banco de talento" highlighted.
 */
export function PortalSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loaded, has } = usePermissions();
  const currentPath =
    searchParams.get("from") === "banco-talento" ? ROUTES.bancoTalento : pathname;

  // Until permissions resolve, show the full menu (fail-open); once known, hide
  // entries the user cannot access and drop any group left empty.
  const groups = useMemo(() => {
    if (!loaded) return PORTAL_NAV;
    return PORTAL_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || has(item.permission)),
    })).filter((group) => group.items.length > 0);
  }, [loaded, has]);

  return <Sidebar groups={groups} currentPath={currentPath} />;
}
