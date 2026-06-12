'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { ROUTES } from '@/shared/constants/routes';
import { Badge } from '@/design-system/ui/badge';
import { Input } from '@/design-system/ui/input';
import { Pagination } from '@/design-system/molecules/Pagination';
import { Select } from '@/design-system/atoms/Select';
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
    return processes.filter((p) => {
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
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre de proceso…"
            className="pl-9"
          />
        </div>

        <Select
          aria-label="Filtrar por cliente"
          className="w-auto min-w-[180px]"
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
        >
          <option value="">Cliente: Todos</option>
          {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </Select>

        <Select
          aria-label="Filtrar por departamento"
          className="w-auto min-w-[180px]"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">Departamento: Todos</option>
          {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
        </Select>

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
