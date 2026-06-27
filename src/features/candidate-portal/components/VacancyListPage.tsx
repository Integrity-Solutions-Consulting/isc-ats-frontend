'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Input } from '@/design-system/ui/input';
import { Combobox } from '@/design-system/molecules/Combobox';
import { ROUTES } from '@/shared/constants/routes';
import { formatTimeAgoEs } from '@/shared/utils';
import type { CandidateVacancy } from '../types';
import { VacancyCard } from './VacancyCard';

interface VacancyListPageProps {
  vacancies: CandidateVacancy[];
}

const workModeOptions = [
  { id: '', label: 'Modalidad: Todas' },
  { id: 'remote', label: 'Remoto' },
  { id: 'onsite', label: 'Presencial' },
  { id: 'hybrid', label: 'Híbrido' },
];

const cityOptions = [
  { id: '', label: 'Ciudad: Todas' },
  { id: 'Guayaquil', label: 'Guayaquil' },
  { id: 'Quito', label: 'Quito' },
  { id: 'Cuenca', label: 'Cuenca' },
];

export function VacancyListPage({ vacancies }: VacancyListPageProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [city, setCity] = useState('');

  const filtered = vacancies.filter((v) => {
    const matchesSearch =
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesMode = !workMode || v.workMode === workMode;
    const matchesCity = !city || v.city === city;
    return matchesSearch && matchesMode && matchesCity;
  });

  const handleCardClick = (id: string) => router.push(ROUTES.candidato.vacante(id));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[22px] font-bold leading-tight text-primary-800">
        Vacantes
      </h1>

      <div className="bg-surface shadow-sm rounded-lg p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"
          />
          <Input
            className="pl-9"
            placeholder="Buscar por cargo, tecnología…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Combobox
          valueKey="id"
          aria-label="Filtrar por modalidad"
          className="w-full sm:w-48"
          value={workMode}
          onChange={setWorkMode}
          options={workModeOptions}
        />

        <Combobox
          valueKey="id"
          aria-label="Filtrar por ciudad"
          className="w-full sm:w-48"
          value={city}
          onChange={setCity}
          options={cityOptions}
        />
      </div>

      <p className="text-sm text-ink-muted">
        {filtered.length} vacante{filtered.length !== 1 ? 's' : ''} disponible
        {filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((vacancy) => (
          <VacancyCard
            key={vacancy.id}
            vacancy={vacancy}
            onClick={() => handleCardClick(vacancy.id)}
            applied={vacancy.applicationStatus === 'applied'}
            footer={
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-ink-muted">
                  Publicada {formatTimeAgoEs(vacancy.publishedAt)}
                </span>

                {vacancy.applicationStatus === 'closing_soon' && vacancy.closingDaysLeft !== null && (
                  <span className="text-[11px] text-warning font-medium">
                    Cierra en {vacancy.closingDaysLeft}d
                  </span>
                )}
              </div>
            }
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-ink-muted">No se encontraron vacantes con esos filtros.</p>
        </div>
      )}
    </div>
  );
}
