import { cookies } from "next/headers";

import { PortalLayout } from "@/design-system/templates/PortalLayout";
import { backendGet } from "@/lib/backendFetch";
import { PermissionsProvider } from "@/features/auth/PermissionsProvider";
import { HeaderWithNotifications } from "./_components/HeaderWithNotifications";
import { PortalSidebar } from "./_components/PortalSidebar";
import { AccessGuard } from "./_components/AccessGuard";

export default async function PortalGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const raw = store.get("session-user")?.value;

  let user = { name: "Usuario", initials: "US" };
  try {
    if (raw) {
      const parsed = JSON.parse(raw) as { name?: string; initials?: string };
      user = {
        name: parsed.name ?? user.name,
        initials: parsed.initials ?? user.initials,
      };
    }
  } catch {}

  // Resolve the user's permissions once, server-side, to gate the menu and routes
  // without a client fetch (no flash). Fail-open on error: the backend still
  // enforces every action, so a transient blip must not lock the whole portal.
  let permissions: string[] = [];
  let permissionsLoaded = false;
  try {
    const data = await backendGet<{ permissions: string[] }>("/auth/me/permissions");
    permissions = data.permissions ?? [];
    permissionsLoaded = true;
  } catch {
    permissionsLoaded = false;
  }

  return (
    <PermissionsProvider codes={permissions} loaded={permissionsLoaded}>
      <PortalLayout
        header={<HeaderWithNotifications user={user} />}
        sidebar={<PortalSidebar />}
      >
        <AccessGuard>{children}</AccessGuard>
      </PortalLayout>
    </PermissionsProvider>
  );
}
