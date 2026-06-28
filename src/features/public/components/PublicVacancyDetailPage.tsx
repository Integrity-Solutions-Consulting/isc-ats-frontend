'use client';

import { useRouter } from 'next/navigation';
import { LogIn, User } from 'lucide-react';

import { ROUTES } from '@/shared/constants/routes';
import { VacancyDetail } from '@/design-system/organisms/VacancyDetail';
import { applyToVacancy } from '@/features/candidate-portal/api/candidateApi';
import type { CandidateVacancy } from '@/features/candidate-portal/types';

interface PublicVacancyDetailPageProps {
  vacancy: CandidateVacancy;
  /** True when the visitor has an active session (access-token cookie present). */
  isAuthenticated: boolean;
}

/**
 * Public job-board view. Authenticated visitors (staff) apply directly;
 * anonymous visitors are sent to login with a returnTo back to this vacancy.
 */
export function PublicVacancyDetailPage({ vacancy, isAuthenticated }: PublicVacancyDetailPageProps) {
  const router = useRouter();

  const handleApply = (salary: number): Promise<void> => {
    if (!isAuthenticated) {
      const returnTo = ROUTES.publicVacante(vacancy.id);
      router.push(`${ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}`);
      // Navigating away — keep the button in its loading state until then.
      return new Promise<void>(() => {});
    }
    return applyToVacancy(vacancy.id, salary);
  };

  return (
    <VacancyDetail
      vacancy={vacancy}
      backHref={ROUTES.publicVacantes}
      salaryLabel="Aspiración salarial"
      applyHint={
        isAuthenticated
          ? { icon: User, text: 'Tu CV y perfil serán enviados automáticamente' }
          : { icon: LogIn, text: 'Para postular necesitas iniciar sesión. Te llevaremos de vuelta a esta vacante.' }
      }
      onApply={handleApply}
      appliedHref={ROUTES.candidato.misPostulaciones}
      appliedExtra={
        <>
          <p className="text-[13px] text-ink-subtle">Tu postulación está siendo revisada.</p>
          <span className="px-3 py-1 bg-warning/15 text-warning text-[12px] font-medium rounded-full">
            En revisión
          </span>
        </>
      }
    />
  );
}
