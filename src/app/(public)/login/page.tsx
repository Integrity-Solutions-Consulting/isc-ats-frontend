import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthLayout } from "@/design-system/templates/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión · Bolsa de Empleo",
};

// LoginForm reads useSearchParams, which requires a Suspense boundary
// for static prerendering of this page.
export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
