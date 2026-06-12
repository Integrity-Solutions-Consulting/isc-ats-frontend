"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { Sidebar } from "@/design-system/organisms/Sidebar";
import { PORTAL_NAV } from "@/shared/constants/navigation";
import { ROUTES } from "@/shared/constants/routes";

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
  const currentPath =
    searchParams.get("from") === "banco-talento" ? ROUTES.bancoTalento : pathname;

  return <Sidebar groups={PORTAL_NAV} currentPath={currentPath} />;
}
