import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PersonalInfoCard } from './PersonalInfoCard';
import type { CandidateProfile } from '../../types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const BASE_PROFILE: CandidateProfile = {
  id: 1,
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@test.example.com',
  phone: '0999999999',
  yearsOfExperience: null,
  docType: 'cedula',
  idNumber: '0102030405',
  birthDate: '',
  city: '',
  educationLevel: '',
  career: '',
  title: '',
  university: '',
  homeAddress: '',
  isStudying: false,
  isWorking: false,
  cvFileName: '',
  cvSizeKb: 0,
  cvUpdatedDaysAgo: 0,
  marketingConsentDecided: true,
  marketingConsentSubscribed: false,
  stats: { vacanciesViewed: 0, applicationsCount: 0, interviewsCount: 0, hiredCount: 0 },
};

function renderCard(profile: CandidateProfile) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PersonalInfoCard profile={profile} />
    </QueryClientProvider>,
  );
}

describe('PersonalInfoCard — años de experiencia', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/api/catalogs/registration')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ cities: [], educationLevels: [], careers: [], titles: [], universities: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }) as unknown as typeof fetch;
  });

  it('shows the incomplete notice when yearsOfExperience is null', () => {
    renderCard(BASE_PROFILE);
    expect(
      screen.getByText(/aún no registraste tus años de experiencia/i),
    ).toBeInTheDocument();
  });

  it('does not show the incomplete notice when yearsOfExperience is set', () => {
    renderCard({ ...BASE_PROFILE, yearsOfExperience: 2.5 });
    expect(
      screen.queryByText(/aún no registraste tus años de experiencia/i),
    ).not.toBeInTheDocument();
  });

  it('renders the current value in read mode', () => {
    renderCard({ ...BASE_PROFILE, yearsOfExperience: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('lets the user fill the field while editing, which hides the notice and saves it', async () => {
    const user = userEvent.setup();
    renderCard(BASE_PROFILE);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    expect(screen.getByText(/aún no registraste tus años de experiencia/i)).toBeInTheDocument();

    const input = screen.getByLabelText(/años de experiencia/i);
    await user.type(input, '2.5');

    expect(
      screen.queryByText(/aún no registraste tus años de experiencia/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/candidate/profile',
      expect.objectContaining({ method: 'PATCH' }),
    ));
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, options]) => url === '/api/candidate/profile' && (options as RequestInit)?.method === 'PATCH',
    );
    const body = JSON.parse((call?.[1] as RequestInit).body as string);
    expect(body.yearsOfExperience).toBe(2.5);
  });
});
