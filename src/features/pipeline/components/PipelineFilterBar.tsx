'use client';

import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Select } from '@/design-system/atoms/Select';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { cn } from '@/shared/utils';
import { EMPTY_FILTERS, hasActiveFilters, type PipelineFilters } from '../filters';

interface PipelineFilterBarProps {
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

const FIELD_LABEL = 'text-[11px] font-medium uppercase tracking-wide text-ink-muted';

/**
 * Width lives on the field group, never on the control itself.
 *
 * `Select` anchors its chevron to an outer full-width wrapper while `className`
 * lands on the inner `<select>` — so a control narrower than its group leaves
 * the arrow floating outside the box. Sizing the group keeps label, control and
 * chevron on the same edge, and lets each control keep its base `w-full`.
 */
const FIELD_GROUP = 'flex flex-col gap-1';

export function PipelineFilterBar({
  filters,
  onChange,
  cityOptions,
  universityOptions,
  shownCount,
  totalCount,
}: PipelineFilterBarProps) {
  function set<K extends keyof PipelineFilters>(key: K, value: PipelineFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const isFiltering = hasActiveFilters(filters);

  return (
    <FilterBar
      className="items-end"
      // `w-full` gives the search its own line inside the wrapping bar: it is the
      // most-used control and reads better full width than squeezed between two
      // selects. The filters below then wrap on their own, fitting a single row
      // on a wide monitor and folding to two on a laptop without any breakpoint.
      search={{
        value: filters.name,
        onChange: (value) => set('name', value),
        placeholder: 'Buscar candidato por nombre',
        className: 'w-full flex-none',
      }}
    >
      {/* Field order follows how often Talento Humano reaches for each one, so
          the frequent ones stay on the first row when the bar wraps. */}

      {/* Minimum match — replaces the old fixed 50/75 pills so HR can type any
          threshold. Matches are kept when equal to or greater than this value. */}
      <div className={cn(FIELD_GROUP, 'w-[165px]')}>
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

      <div className={cn(FIELD_GROUP, 'w-[250px]')}>
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

      <div className={cn(FIELD_GROUP, 'w-[165px]')}>
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

      <div className={cn(FIELD_GROUP, 'w-[170px]')}>
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

      {/* Wider than the other selects: university names run long
          ("Escuela Superior Politécnica del Litoral"). */}
      <div className={cn(FIELD_GROUP, 'w-[210px]')}>
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

      <div className={cn(FIELD_GROUP, 'w-[165px]')}>
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
      <div className={cn(FIELD_GROUP, 'w-[300px]')}>
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

      <div className="ml-auto flex items-center gap-3 pb-0.5">
        <span className="text-xs text-ink-muted">
          {shownCount} de {totalCount} candidatos
        </span>
        {isFiltering && (
          <Button variant="outline" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </FilterBar>
  );
}
