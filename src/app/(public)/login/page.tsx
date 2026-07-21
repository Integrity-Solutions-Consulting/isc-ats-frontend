import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthLayout } from "@/design-system/templates/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión · Mi Chamba",
};

// Read the Turnstile site key at request time (server-side) so it comes from the
// runtime environment, not the build. The key is passed down to the client as a
// prop, so it needs no NEXT_PUBLIC_ prefix — a plain server-only env var is read
// at runtime by the standalone server and never inlined at build.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY ?? "";
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <LoginForm turnstileSiteKey={turnstileSiteKey} />
      </Suspense>
    </AuthLayout>
  );
}
