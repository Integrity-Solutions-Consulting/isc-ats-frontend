import { cookies } from "next/headers";

import { PortalLayout } from "@/design-system/templates/PortalLayout";
import { HeaderWithNotifications } from "./_components/HeaderWithNotifications";
import { PortalSidebar } from "./_components/PortalSidebar";

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

  return (
    <PortalLayout
      header={<HeaderWithNotifications user={user} />}
      sidebar={<PortalSidebar />}
    >
      {children}
    </PortalLayout>
  );
}
