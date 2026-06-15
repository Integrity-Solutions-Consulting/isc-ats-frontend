'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Input } from '@/design-system/ui/input';
import { Select } from '@/design-system/atoms/Select';
import { ROUTES } from '@/shared/constants/routes';
import type { CandidateVacancy } from '../types';
import { VacancyCard } from './VacancyCard';

interface VacancyListPageProps {
  vacancies: CandidateVacancy[];
}

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

      <div className="bg-surface shadow-sm rounded-lg p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
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

        <div className="w-full sm:w-40">
          <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
            <option value="">Modalidad</option>
            <option value="remote">Remoto</option>
            <option value="onsite">Presencial</option>
            <option value="hybrid">Híbrido</option>
          </Select>
        </div>

        <div className="w-full sm:w-40">
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Ciudad</option>
            <option value="Guayaquil">Guayaquil</option>
            <option value="Quito">Quito</option>
            <option value="Cuenca">Cuenca</option>
          </Select>
        </div>

        <button className="shrink-0 bg-primary-700 text-white text-[13px] font-semibold rounded-[100px] px-[18px] py-2 hover:bg-primary-600 transition-colors">
          Buscar
        </button>
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
            footer={
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-ink-muted">
                  Publicada hace {vacancy.publishedDaysAgo} día{vacancy.publishedDaysAgo !== 1 ? 's' : ''}
                </span>

                {vacancy.applicationStatus === 'applied' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-400 rounded-full text-[12px]">
                    ✓ Ya postulaste
                  </div>
                )}

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
