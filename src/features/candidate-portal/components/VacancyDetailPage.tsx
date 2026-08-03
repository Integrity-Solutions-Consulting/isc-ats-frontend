'use client';

import { User } from 'lucide-react';

import { ROUTES } from '@/shared/constants/routes';
import { VacancyDetail } from '@/design-system/organisms/VacancyDetail';
import { applyToVacancy } from '../api/candidateApi';
import type { CandidateVacancy } from '../types';

interface VacancyDetailPageProps {
  vacancy: CandidateVacancy;
}

/** Authenticated portal view: applying always submits directly. */
export function VacancyDetailPage({ vacancy }: VacancyDetailPageProps) {
  return (
    <VacancyDetail
      vacancy={vacancy}
      backHref={ROUTES.candidato.vacantes}
      salaryLabel="Aspiración salarial"
      applyHint={{ icon: User, text: 'Tu hoja de vida y tu perfil se enviarán automáticamente' }}
      appliedHref={ROUTES.candidato.misPostulaciones}
      onApply={(salary) => applyToVacancy(vacancy.id, salary)}
    />
  );
}
