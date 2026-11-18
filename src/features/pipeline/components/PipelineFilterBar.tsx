'use client';

import type { ReactNode } from 'react';
import { TechnologyFilter } from './TechnologyFilter';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Combobox } from '@/design-system/molecules/Combobox';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { cn } from '@/shared/utils';
import { EMPTY_FILTERS, hasActiveFilters, type PipelineFilters } from '../filters';
import type { PipelineStage } from '../types';

interface PipelineFilterBarProps {
  technologyOptions: string[];
  technologiesDisabled?: boolean;
  actions?: ReactNode;
  stages: PipelineStage[];
  filters: PipelineFilters;
  onChange: (filters: PipelineFilters) => void;
  /** Cities present among this vacancy's candidates. */
  cityOptions: string[];
  /** Universities present among this vacancy's candidates. */
  universityOptions: string[];
  /** Candidates left after filtering, out of the vacancy's total. */
  shownCount: number;
  totalCount: number;
}

/** '' clears a numeric filter; anything unparseable is ignored the same way. */
function toNumberOrNull(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

const FIELD_LABEL = 'text-sm font-medium text-ink-muted';

const FIELD_GROUP = 'flex min-w-0 flex-col gap-2';

export function PipelineFilterBar({
  stages,
  filters,
  onChange,
  cityOptions,
  universityOptions,
  shownCount,
  totalCount,
  technologyOptions,
  technologiesDisabled,
  actions,
}: PipelineFilterBarProps) {
  function set<K extends keyof PipelineFilters>(key: K, value: PipelineFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const isFiltering = hasActiveFilters(filters);

  return (
    <FilterBar
      className="grid grid-cols-1 items-end gap-x-4 gap-y-5 bg-surface p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-6 [&_input]:bg-surface-2/50 [&_input]:shadow-none [&_select]:bg-surface-2/50 [&_select]:shadow-none"
      search={{
        value: filters.name,
        onChange: (value) => set('name', value),
        placeholder: 'Buscar candidato por nombre',
        className: 'col-span-full min-w-0 w-full',
      }}
    >
      <div className={FIELD_GROUP}>
        <label htmlFor="filter-min-match" className={FIELD_LABEL}>
          Cumplimiento mínimo
        </label>
        <div className="relative">
          <Input
            id="filter-min-match"
            type="text"
            inputMode="numeric"
            placeholder="Sin filtro"
            value={filters.minMatch ?? ''}
            onChange={(e) => set('minMatch', toNumberOrNull(e.target.value))}
            className="pr-7"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">
            %
          </span>
        </div>
      </div>

      <div className={cn(FIELD_GROUP, 'sm:col-span-2')}>
        <span className={FIELD_LABEL}>Aspiración salarial</span>
        <div className="flex items-center gap-1.5">
          <Input
            aria-label="Aspiración salarial desde"
            type="text"
            inputMode="numeric"
            placeholder="Desde"
            value={filters.minSalary ?? ''}
            onChange={(e) => set('minSalary', toNumberOrNull(e.target.value))}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 text-sm text-ink-subtle">—</span>
          <Input
            aria-label="Aspiración salarial hasta"
            type="text"
            inputMode="numeric"
            placeholder="Hasta"
            value={filters.maxSalary ?? ''}
            onChange={(e) => set('maxSalary', toNumberOrNull(e.target.value))}
            className="min-w-0 flex-1"
          />
        </div>
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-min-experience" className={FIELD_LABEL}>
          Experiencia mínima
        </label>
        <div className="relative">
          <Input
            id="filter-min-experience"
            type="text"
            inputMode="numeric"
            placeholder="Sin filtro"
            value={filters.minExperience ?? ''}
            onChange={(e) => set('minExperience', toNumberOrNull(e.target.value))}
            className="pr-11"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">
            años
          </span>
        </div>
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-city" className={FIELD_LABEL}>
          Ciudad
        </label>
        <Combobox
          id="filter-city"
          valueKey="id"
          lettersOnly
          clearSearchOnOpen
          emptyValueShowsPlaceholder
          placeholder="Ciudad"
          value={filters.city}
          onChange={(value) => set('city', value)}
          options={[{ id: '', label: 'Todas' }, ...cityOptions.map((city) => ({ id: city, label: city }))]}
        />
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-university" className={FIELD_LABEL}>
          Universidad
        </label>
        <Combobox
          id="filter-university"
          valueKey="id"
          lettersOnly
          clearSearchOnOpen
          emptyValueShowsPlaceholder
          placeholder="Universidad"
          value={filters.university}
          onChange={(value) => set('university', value)}
          options={[{ id: '', label: 'Todas' }, ...universityOptions.map((university) => ({ id: university, label: university }))]}
        />
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-studying" className={FIELD_LABEL}>
          Estudia actualmente
        </label>
        <Combobox
          id="filter-studying"
          valueKey="id"
          selectOnly
          emptyValueShowsPlaceholder
          placeholder="Estudia actualmente"
          value={filters.studying === 'all' ? '' : filters.studying}
          onChange={(value) => {
            if (value === '' || value === 'yes' || value === 'no') set('studying', value || 'all');
          }}
          options={[{ id: '', label: 'Todos' }, { id: 'yes', label: 'Sí' }, { id: 'no', label: 'No' }]}
        />
      </div>

      {/* Named for what it filters: the card's date moves on any activity — a
          stage change included — not only when the candidate applied. */}
      <div className={cn(FIELD_GROUP, 'sm:col-span-2')}>
        <span className={FIELD_LABEL}>Última actualización</span>
        <div className="flex items-center gap-1.5">
          <Input
            aria-label="Última actualización desde"
            type="date"
            value={filters.updatedFrom}
            max={filters.updatedTo || undefined}
            onChange={(e) => set('updatedFrom', e.target.value)}
            className="min-w-0 flex-1 text-ink-muted [&::-webkit-calendar-picker-indicator]:opacity-50"
          />
          <span className="shrink-0 text-sm text-ink-subtle">—</span>
          <Input
            aria-label="Última actualización hasta"
            type="date"
            value={filters.updatedTo}
            min={filters.updatedFrom || undefined}
            onChange={(e) => set('updatedTo', e.target.value)}
            className="min-w-0 flex-1 text-ink-muted [&::-webkit-calendar-picker-indicator]:opacity-50"
          />
        </div>
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-process-stage" className={FIELD_LABEL}>
          Estado
        </label>
        <Combobox
          id="filter-process-stage"
          valueKey="id"
          selectOnly
          emptyValueShowsPlaceholder
          placeholder="Estado"
          value={filters.processStageId}
          onChange={(value) => set('processStageId', value)}
          options={[{ id: '', label: 'Todos' }, ...stages.map((stage) => ({ id: stage.id, label: stage.name }))]}
        />
      </div>

      <TechnologyFilter options={technologyOptions} selected={filters.technologies} onChange={(values) => set('technologies', values)} disabled={technologiesDisabled} />

      <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-sm text-ink-muted">
          {shownCount} de {totalCount} candidatos
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {isFiltering && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
              Limpiar filtros
            </Button>
          )}
          {actions}
        </div>
      </div>
    </FilterBar>
  );
}
