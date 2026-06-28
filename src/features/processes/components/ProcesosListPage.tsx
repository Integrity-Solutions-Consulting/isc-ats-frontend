'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { ROUTES } from '@/shared/constants/routes';
import { Badge } from '@/design-system/ui/badge';
import { Pagination } from '@/design-system/molecules/Pagination';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { Combobox } from '@/design-system/molecules/Combobox';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { usePagedData } from '@/shared/hooks/usePagedData';
import { listProcesses, type Process } from '../api/processesApi';

const PAGE_SIZE = 10;

const COLUMNS: ColumnDef<Process>[] = [
  {
    header: 'Nombre',
    key: 'name',
    render: (row) => <span className="font-medium text-ink">{row.name}</span>,
  },
  { header: 'Cliente', key: 'clientCompany', render: (row) => row.clientCompany },
  { header: 'Departamento', key: 'department', render: (row) => row.department },
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

export function ProcesosListPage() {
  const router = useRouter();
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['processes'],
    queryFn: listProcesses,
  });
  const { data: clients = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['org', 'client-companies'],
    queryFn: () => fetch('/api/org/client-companies').then((r) => r.json()),
  });
  const { data: departments = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['org', 'departments'],
    queryFn: () => fetch('/api/org/departments').then((r) => r.json()),
  });

  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...processes].sort((a, b) => Number(b.id) - Number(a.id)).filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filterClient && p.clientCompany !== filterClient) return false;
      if (filterDept && p.department !== filterDept) return false;
      if (filterStatus === 'active' && !p.isActive) return false;
      if (filterStatus === 'inactive' && p.isActive) return false;
      return true;
    });
  }, [processes, search, filterClient, filterDept, filterStatus]);

  const { pageRows, page, pageCount, goPrev, goNext } = usePagedData(filtered, PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Procesos de selección</h1>
        <Button asChild>
          <Link href={ROUTES.configuracion.procesoNuevo}>
            <Plus />
            Nuevo proceso
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar por nombre de proceso…',
        }}
      >
        <Combobox
          valueKey="id"
          aria-label="Filtrar por cliente"
          className="w-auto min-w-[180px]"
          value={filterClient}
          onChange={setFilterClient}
          options={[
            { id: '', label: 'Cliente: Todos' },
            ...clients.map((c) => ({ id: c.name, label: c.name })),
          ]}
        />

        <Combobox
          valueKey="id"
          aria-label="Filtrar por departamento"
          className="w-auto min-w-[180px]"
          value={filterDept}
          onChange={setFilterDept}
          options={[
            { id: '', label: 'Departamento: Todos' },
            ...departments.map((d) => ({ id: d.name, label: d.name })),
          ]}
        />

        <Combobox
          valueKey="id"
          aria-label="Filtrar por estado"
          className="w-auto min-w-[150px]"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { id: '', label: 'Estado: Todos' },
            { id: 'active', label: 'Activo' },
            { id: 'inactive', label: 'Inactivo' },
          ]}
        />
      </FilterBar>

      {/* Table + pagination */}
      <div className="flex flex-col gap-3">
        <DataTable
          columns={COLUMNS}
          data={pageRows}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(ROUTES.configuracion.proceso(row.id))}
          isLoading={isLoading}
          emptyState={{ title: 'Sin procesos para los filtros seleccionados.' }}
        />

        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>
              Mostrando {pageRows.length} de{' '}
              <span className="font-medium text-ink">{filtered.length}</span> proceso{filtered.length !== 1 ? 's' : ''}
            </span>
            <Pagination page={page} pageCount={pageCount} onPrev={goPrev} onNext={goNext} />
          </div>
        )}
      </div>
    </div>
  );
}
