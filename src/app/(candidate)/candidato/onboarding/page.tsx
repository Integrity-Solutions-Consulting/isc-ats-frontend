import type { Metadata } from 'next';
import { OnboardingPage } from '@/features/candidate-portal/components/OnboardingPage';
import { listVacancies } from '@/features/candidate-portal/api/candidateApi';
import { VacancyListPage } from '@/features/candidate-portal/components/VacancyListPage';

export const metadata: Metadata = {
  title: 'Completa tu perfil · Bolsa de Empleo',
};

export default async function Page() {
  const vacancies = await listVacancies();
  return (
    <div className="relative">
      {/* Blurred background — portal vacantes */}
      <div className="pointer-events-none select-none opacity-40 blur-sm">
        <VacancyListPage vacancies={vacancies} />
      </div>
      {/* Onboarding modal on top */}
      <OnboardingPage />
    </div>
  );
}
