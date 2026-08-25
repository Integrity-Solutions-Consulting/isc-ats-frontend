import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { VacancyDetail } from './VacancyDetail';
import type { CandidateVacancy } from '@/features/candidate-portal/types';

const vacancy: CandidateVacancy = {
  id: '1',
  title: 'Desarrollador Backend',
  workMode: 'remote',
  level: 'Semi-senior',
  experienceYears: 2,
  city: 'Guayaquil',
  durationMonths: null,
  skills: [],
  description: '',
  requirements: { knowledge: [], tools: [], skills: [], certifications: [] },
  conditions: {
    duration: 'Indefinida',
    city: 'Guayaquil',
    schedule: 'Tiempo completo',
    education: 'Tercer nivel',
    level: 'Semi-senior',
    openings: 1,
  },
  publishedAt: new Date().toISOString(),
  closingDaysLeft: null,
  applicationStatus: 'none',
};

async function applyWithSalary(onApply: (salary: number) => Promise<void>) {
  const user = userEvent.setup();
  render(
    <VacancyDetail
      vacancy={vacancy}
      backHref="/vacantes"
      salaryLabel="Aspiración salarial"
      onApply={onApply}
      appliedHref="/mis-postulaciones"
    />,
  );
  await user.type(screen.getByPlaceholderText('0'), '1000');
  await user.click(screen.getByRole('button', { name: /postular ahora/i }));
}

describe('VacancyDetail — apply error surfacing', () => {
  it('shows the backend/proxy error message when onApply rejects with an Error', async () => {
    const onApply = vi.fn().mockRejectedValue(
      new Error('Completa tus años de experiencia en tu perfil antes de postular.'),
    );

    await applyWithSalary(onApply);

    await waitFor(() =>
      expect(
        screen.getByText('Completa tus años de experiencia en tu perfil antes de postular.'),
      ).toBeInTheDocument(),
    );
  });

  it('falls back to the generic message for a non-Error rejection', async () => {
    const onApply = vi.fn().mockRejectedValue('boom');

    await applyWithSalary(onApply);

    await waitFor(() =>
      expect(
        screen.getByText('No fue posible enviar tu postulación. Por favor, intenta de nuevo.'),
      ).toBeInTheDocument(),
    );
  });
});
