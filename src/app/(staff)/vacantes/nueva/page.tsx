"use client";

import { PERM } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/PermissionsProvider";
import { VacancyForm } from "@/features/vacancies/components/VacancyForm";
import { AccessDenied } from "@/app/(staff)/_components/AccessDenied";

// AccessGuard only enforces the coarse `/vacantes` prefix permission
// (recruitment.vacancies.read), so a user with read-only access could still
// reach this create route by URL. Mirrors AccessGuard's fail-open check
// (loaded && !has(...)) scoped to the create permission specifically.
export default function Page() {
  const { loaded, has } = usePermissions();
  if (loaded && !has(PERM.vacanciesCreate)) {
    return <AccessDenied />;
  }
  return <VacancyForm mode="create" title="Nueva vacante" />;
}
