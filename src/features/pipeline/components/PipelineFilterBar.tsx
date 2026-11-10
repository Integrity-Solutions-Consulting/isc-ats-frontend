'use client';

import type { ReactNode } from 'react';
import { TechnologyFilter } from './TechnologyFilter';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Select } from '@/design-system/atoms/Select';
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
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

const FIELD_LABEL = 'text-xs font-medium text-ink-muted';

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
            type="number"
            min={0}
            max={100}
            step={5}
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
            type="number"
            min={0}
            step={50}
            inputMode="numeric"
            placeholder="Desde"
            value={filters.minSalary ?? ''}
            onChange={(e) => set('minSalary', toNumberOrNull(e.target.value))}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 text-sm text-ink-subtle">—</span>
          <Input
            aria-label="Aspiración salarial hasta"
            type="number"
            min={0}
            step={50}
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
            type="number"
            min={0}
            step={0.5}
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
        <Select
          id="filter-city"
          value={filters.city}
          onChange={(e) => set('city', e.target.value)}
        >
          <option value="">Todas</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-university" className={FIELD_LABEL}>
          Universidad
        </label>
        <Select
          id="filter-university"
          value={filters.university}
          onChange={(e) => set('university', e.target.value)}
        >
          <option value="">Todas</option>
          {universityOptions.map((university) => (
            <option key={university} value={university}>
              {university}
            </option>
          ))}
        </Select>
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-studying" className={FIELD_LABEL}>
          Estudia actualmente
        </label>
        <Select
          id="filter-studying"
          value={filters.studying}
          onChange={(e) => set('studying', e.target.value as PipelineFilters['studying'])}
        >
          <option value="all">Todos</option>
          <option value="yes">Sí</option>
          <option value="no">No</option>
        </Select>
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
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 text-sm text-ink-subtle">—</span>
          <Input
            aria-label="Última actualización hasta"
            type="date"
            value={filters.updatedTo}
            min={filters.updatedFrom || undefined}
            onChange={(e) => set('updatedTo', e.target.value)}
            className="min-w-0 flex-1"
          />
        </div>
      </div>

      <div className={FIELD_GROUP}>
        <label htmlFor="filter-process-stage" className={FIELD_LABEL}>
          Estado
        </label>
        <Select
          id="filter-process-stage"
          value={filters.processStageId}
          onChange={(e) => set('processStageId', e.target.value)}
        >
          <option value="">Todos</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>{stage.name}</option>
          ))}
        </Select>
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
