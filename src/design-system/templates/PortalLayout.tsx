import { Suspense } from "react";

import { Brand } from "@/design-system/atoms/Brand";

interface PortalLayoutProps {
  /** Top bar. Passed as a slot so the header can include feature components
   *  (e.g. NotificationsPanel) without design-system importing from features. */
  header: React.ReactNode;
  /** Navigation rail. Passed as a slot so icon components stay client-side. */
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

/** App shell: dark brand+nav rail on the left, header on top, content area. */
export function PortalLayout({ header, sidebar, children }: PortalLayoutProps) {
  return (
    <div className="grid h-dvh grid-cols-[248px_1fr] grid-rows-[64px_1fr]">
      <div className="col-start-1 row-start-1 flex items-center border-b border-white/10 bg-sidebar px-5">
        <Brand tone="dark" />
      </div>
      <div className="col-start-2 row-start-1 border-b border-border bg-surface">
        {/* Suspense: header reads useSearchParams (talent-pool nav state),
            which requires a boundary for static prerendering in Next 16. */}
        <Suspense fallback={null}>{header}</Suspense>
      </div>
      <div className="col-start-1 row-start-2 min-h-0 bg-sidebar">
        <Suspense fallback={null}>{sidebar}</Suspense>
      </div>
      <main className="col-start-2 row-start-2 overflow-auto bg-bg">
        <div className="flex min-h-full flex-col p-6">{children}</div>
      </main>
    </div>
  );
}
