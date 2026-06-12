'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';

import { Badge } from '@/design-system/ui/badge';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { Pagination } from '@/design-system/molecules/Pagination';
import { Select } from '@/design-system/atoms/Select';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { usePagedData } from '@/shared/hooks/usePagedData';
import { listTemplates } from '../api/profileTemplatesApi';
import type { ProfileTemplateRecord } from '../api/mockData';

const PAGE_SIZE = 10;

const COLUMNS: ColumnDef<ProfileTemplateRecord>[] = [
  {
    header: 'Nombre',
    key: 'name',
    render: (row) => <span className="font-medium text-ink">{row.name}</span>,
  },
  {
    header: 'Estado',
    key: 'isActive',
    render: (row) => (
      <Badge variant={row.isActive ? 'success' : 'neutral'}>
        {row.isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

export function PlantillasPage() {
  const router = useRouter();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['profile-templates'],
    queryFn: listTemplates,
  });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      if (filterStatus === 'active' && !t.isActive) return false;
      if (filterStatus === 'inactive' && t.isActive) return false;
      return true;
    });
  }, [templates, search, filterStatus]);

  const { pageRows, page, pageCount, goPrev, goNext } = usePagedData(filtered, PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Plantillas de cargo</h1>
        <Button asChild>
          <Link href={ROUTES.configuracion.plantillaNueva}>
            <Plus />
            Nueva plantilla
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Filtrar por estado"
          className="w-auto min-w-[150px]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Estado: Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          data={pageRows}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(ROUTES.configuracion.plantilla(row.id))}
          isLoading={isLoading}
          skeletonRows={5}
          emptyState={{ title: 'Sin plantillas para los filtros seleccionados.' }}
        />

        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>
              Mostrando {pageRows.length} de{' '}
              <span className="font-medium text-ink">{filtered.length}</span> plantilla{filtered.length !== 1 ? 's' : ''}
            </span>
            <Pagination page={page} pageCount={pageCount} onPrev={goPrev} onNext={goNext} />
          </div>
        )}
      </div>
    </div>
  );
}
