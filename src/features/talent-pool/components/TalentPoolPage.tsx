'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/design-system/ui/badge';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { Select } from '@/design-system/atoms/Select';
import { Avatar } from '@/design-system/atoms/Avatar';
import { cn } from '@/shared/utils';
import { ROUTES } from '@/shared/constants/routes';
import { useTalentPool } from '../hooks/useTalentPool';
import { useTalentPoolNavStore } from '@/shared/stores/talentPoolNavStore';
import type { TalentPoolEntry, TalentPoolFilters } from '../types';

const MATCH_COLORS = (pct: number) => {
  if (pct >= 75) return 'text-success bg-success/10';
  if (pct >= 50) return 'text-warning bg-warning/10';
  return 'text-danger bg-danger/10';
};

export function TalentPoolPage() {
  const router = useRouter();
  const { data: entries = [], isLoading } = useTalentPool();
  const setNavEntries = useTalentPoolNavStore((s) => s.setEntries);

  const [filters, setFilters] = useState<TalentPoolFilters>({
    search: '',
    career: null,
    vacancyId: null,
    status: '',
  });

  const careers = [...new Set(entries.map((e) => e.career))];
  const vacancies = [...new Map(entries.map((e) => [e.vacancyId, e.vacancyTitle])).entries()];

  const filtered = entries.filter((e) => {
    const q = filters.search.toLowerCase();
    if (q && !e.candidateName.toLowerCase().includes(q) && !e.career.toLowerCase().includes(q)) return false;
    if (filters.career && e.career !== filters.career) return false;
    if (filters.vacancyId && e.vacancyId !== filters.vacancyId) return false;
    if (filters.status === 'active' && !e.isActive) return false;
    if (filters.status === 'inactive' && e.isActive) return false;
    return true;
  });

  const columns: ColumnDef<TalentPoolEntry>[] = [
    {
      key: 'candidate',
      header: 'Candidato',
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="sm" initials={e.candidateInitials} className={cn('text-white', e.avatarColor)} />
          <span className="font-medium text-ink">{e.candidateName}</span>
        </div>
      ),
    },
    {
      key: 'vacancyTitle',
      header: 'Vacante de origen',
      render: (e) => <span className="text-ink-muted">{e.vacancyTitle}</span>,
    },
    {
      key: 'career',
      header: 'Carrera',
      render: (e) => <span className="text-ink-muted">{e.career}</span>,
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (e) => <span className="text-ink-muted">{e.phone}</span>,
    },
    {
      key: 'email',
      header: 'Correo',
      render: (e) => <span className="text-ink-muted">{e.email}</span>,
    },
    {
      key: 'match',
      header: 'Match',
      align: 'right',
      render: (e) => (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', MATCH_COLORS(e.matchPercent))}>
          {e.matchPercent}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (e) => (
        <Badge variant={e.isActive ? 'success' : 'neutral'}>
          {e.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">Banco de talento</h1>

      {/* Filters */}
      <FilterBar
        search={{
          value: filters.search,
          onChange: (value) => setFilters((f) => ({ ...f, search: value })),
          placeholder: 'Buscar candidato o carrera…',
        }}
      >
        <Select
          aria-label="Filtrar por carrera"
          className="w-auto min-w-[180px]"
          value={filters.career ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, career: e.target.value || null }))}
        >
          <option value="">Carrera: Todas</option>
          {careers.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>

        <Select
          aria-label="Filtrar por vacante de origen"
          className="w-auto min-w-[200px]"
          value={filters.vacancyId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, vacancyId: e.target.value || null }))}
        >
          <option value="">Vacante de origen: Todas</option>
          {vacancies.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </Select>

        <Select
          aria-label="Filtrar por estado"
          className="w-auto min-w-[150px]"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Estado: Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        onRowClick={(entry) => {
          const idx = filtered.indexOf(entry);
          setNavEntries(filtered.map((e) => ({ candidateId: e.candidateId, tpId: e.id })));
          router.push(ROUTES.bancoTalentoCandidate(entry.candidateId, {
            pos: idx + 1,
            total: filtered.length,
            tpId: entry.id,
          }));
        }}
        emptyState={{ title: 'Sin resultados para los filtros seleccionados.' }}
      />

      <div className="text-sm text-ink-muted">
        Mostrando {filtered.length} de <span className="font-medium text-ink">{entries.length}</span> candidato{entries.length !== 1 ? 's' : ''} guardado{entries.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
