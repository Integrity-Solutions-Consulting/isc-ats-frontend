'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/design-system/ui/badge';
import { Combobox } from '@/design-system/molecules/Combobox';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { Pagination } from '@/design-system/molecules/Pagination';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { ROUTES } from '@/shared/constants/routes';
import { usePagedData } from '@/shared/hooks/usePagedData';
import { useAllInterviews } from '../hooks/useInterviews';
import {
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  formatInterviewDateTime,
  isPastInterview,
} from '../labels';
import type { InterviewListItem, InterviewStatus } from '../types';

const PAGE_SIZE = 20;

// Fetched once and filtered/paginated client-side — same convention as every
// other list page in this app (Vacantes, Procesos, Plantillas, ...), all of
// which request the backend's max page size and do search/filters locally
// rather than round-tripping per keystroke or per page.
const FETCH_SIZE = 100;

// Only the statuses any current flow can actually set (Modo A = scheduled,
// Modo B = offered → confirmed). `cancelled`/`completed` exist in the
// interview_status catalog and the Estado column still renders them
// correctly if a row somehow has one, but no UI action sets them today, so
// offering them as filter choices would just be dead options.
const FILTERABLE_STATUSES: InterviewStatus[] = ['scheduled', 'offered', 'confirmed'];

const STATUS_FILTER_OPTIONS = [
  { id: '', label: 'Estado: Todos' },
  ...FILTERABLE_STATUSES.map((id) => ({ id, label: STATUS_LABEL[id] })),
];

const WHEN_FILTER_OPTIONS = [
  { id: '', label: 'Cuándo: Todas' },
  { id: 'past', label: 'Pasadas' },
  { id: 'upcoming', label: 'Próximas' },
];

const COLUMNS: ColumnDef<InterviewListItem>[] = [
  { header: 'Candidato', key: 'candidateName', render: (row) => row.candidateName },
  {
    header: 'Vacante',
    key: 'vacancyName',
    render: (row) => (
      <Link
        href={ROUTES.vacante(String(row.vacancyId))}
        className="font-medium text-primary-700 hover:underline"
      >
        {row.vacancyName}
      </Link>
    ),
  },
  {
    header: 'Fecha y hora',
    key: 'scheduledAt',
    render: (row) =>
      row.scheduledAt ? (
        <span className="capitalize">{formatInterviewDateTime(row.scheduledAt)}</span>
      ) : (
        <span className="text-ink-subtle">—</span>
      ),
  },
  { header: 'Entrevistador', key: 'interviewerEmail', render: (row) => row.interviewerEmail },
  {
    header: 'Estado',
    key: 'status',
    render: (row) => (
      <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>
    ),
  },
  {
    header: 'Cuándo',
    key: 'when',
    render: (row) =>
      // Neither "past" nor "upcoming" makes sense for a cancelled interview
      // (its own Estado badge already says Cancelada) or an open Mode B offer
      // that has no scheduledAt yet (candidate hasn't picked a slot) — both
      // leave this column blank instead of a misleading verdict.
      row.status === 'cancelled' || !row.scheduledAt ? (
        <span className="text-ink-subtle">—</span>
      ) : (
        <Badge variant={isPastInterview(row.scheduledAt) ? 'neutral' : 'success'}>
          {isPastInterview(row.scheduledAt) ? 'Pasada' : 'Próxima'}
        </Badge>
      ),
  },
];

/** Global "Entrevistas" screen — all interviews across all vacancies. */
export function InterviewsListPage() {
  const { data, isLoading, isError } = useAllInterviews({ size: FETCH_SIZE });
  const items = useMemo(() => data?.items ?? [], [data]);

  const [search, setSearch] = useState('');
  const [filterVacancy, setFilterVacancy] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWhen, setFilterWhen] = useState('');

  const vacancyOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) seen.set(String(item.vacancyId), item.vacancyName);
    return [
      { id: '', label: 'Vacante: Todas' },
      ...[...seen.entries()].map(([id, label]) => ({ id, label })),
    ];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((row) => {
      if (q && !row.candidateName.toLowerCase().includes(q)) return false;
      if (filterVacancy && String(row.vacancyId) !== filterVacancy) return false;
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterWhen) {
        // Mirrors the "Cuándo" column: cancelled interviews and open offers
        // with no scheduledAt yet match neither "Pasadas" nor "Próximas".
        if (row.status === 'cancelled' || !row.scheduledAt) return false;
        const past = isPastInterview(row.scheduledAt);
        if (filterWhen === 'past' && !past) return false;
        if (filterWhen === 'upcoming' && past) return false;
      }
      return true;
    });
  }, [items, search, filterVacancy, filterStatus, filterWhen]);

  const { pageRows, page, pageCount, goPrev, goNext } = usePagedData(filtered, PAGE_SIZE);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-ink">Entrevistas</h1>

      {isError ? (
        <EmptyState
          title="No se pudieron cargar las entrevistas"
          description="Ocurrió un error al obtener la información. Intenta nuevamente."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <FilterBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: 'Buscar por candidato…',
            }}
          >
            <Combobox
              valueKey="id"
              aria-label="Filtrar por vacante"
              className="w-auto min-w-[200px]"
              value={filterVacancy}
              onChange={setFilterVacancy}
              options={vacancyOptions}
            />
            <Combobox
              valueKey="id"
              aria-label="Filtrar por estado"
              className="w-auto min-w-[170px]"
              value={filterStatus}
              onChange={setFilterStatus}
              options={STATUS_FILTER_OPTIONS}
            />
            <Combobox
              valueKey="id"
              aria-label="Filtrar por cuándo"
              className="w-auto min-w-[150px]"
              value={filterWhen}
              onChange={setFilterWhen}
              options={WHEN_FILTER_OPTIONS}
            />
          </FilterBar>

          <DataTable
            columns={COLUMNS}
            data={pageRows}
            rowKey={(row) => row.id}
            isLoading={isLoading && items.length === 0}
            emptyState={{ title: 'Sin entrevistas para los filtros seleccionados.' }}
          />

          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>
              Mostrando {pageRows.length} de{' '}
              <span className="font-medium text-ink">{filtered.length}</span> entrevista
              {filtered.length !== 1 ? 's' : ''}
            </span>
            <Pagination page={page} pageCount={pageCount} onPrev={goPrev} onNext={goNext} />
          </div>
        </div>
      )}
    </div>
  );
}
