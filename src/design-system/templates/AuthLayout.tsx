import { Brand } from "@/design-system/atoms/Brand";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/** Split-screen auth shell: form column on the left, brand panel on the right. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,520px)_1fr]">
      {/* Form column */}
      <div className="flex flex-col gap-10 px-8 py-10 sm:px-14">
        <Brand />
        <div className="flex flex-1 flex-col justify-center">{children}</div>
        <p className="text-xs text-ink-subtle">© 2026 Integrity Solutions</p>
      </div>

      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary-900 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <span className="pointer-events-none absolute -right-12 -top-16 select-none text-[320px] font-bold leading-none text-white/[0.04]">
          IS
        </span>
        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-md text-4xl font-bold leading-tight text-white">
            Conectando el mejor talento con las mejores oportunidades
          </h2>
          <p className="mt-3 text-sm text-primary-200">
            Integrity Solutions · Talento Humano
          </p>
        </div>
      </aside>
    </div>
  );
}
