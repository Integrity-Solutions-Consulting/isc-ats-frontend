'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/design-system/ui/badge';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { Pagination } from '@/design-system/molecules/Pagination';
import { Combobox } from '@/design-system/molecules/Combobox';

interface Client { id: string; name: string; is_active: boolean; }

const QUERY_KEY = ['org', 'client-companies'];
const PAGE_SIZE = 10;

async function fetchClients(): Promise<Client[]> {
  const res = await fetch('/api/org/client-companies', { cache: 'no-store' });
  if (!res.ok) throw new Error('Error loading clients');
  return res.json() as Promise<Client[]>;
}

// Read-only view. Clients are a live mirror of the external TMR system — they are
// created/edited/deactivated in TMR, never here — so this page only lists them.
export function ClientesPage() {
  const { data: clients = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: fetchClients });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);

  const visible = [...clients].sort((a, b) => Number(b.id) - Number(a.id)).filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q)) return false;
    if (filterStatus === 'active' && !c.is_active) return false;
    if (filterStatus === 'inactive' && c.is_active) return false;
    if (!filterStatus && !c.is_active) return false;
    return true;
  });

  const pageCount = Math.ceil(visible.length / PAGE_SIZE);
  const paginated = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: ColumnDef<Client>[] = [
    {
      key: 'name', header: 'Nombre',
      render: (c) => <span className="font-medium text-ink">{c.name}</span>,
    },
    {
      key: 'status', header: 'Estado',
      render: (c) => <Badge variant={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Activo' : 'Inactivo'}</Badge>,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" /> Cargando clientes…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Clientes</h1>
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: (v) => { setSearch(v); setPage(0); },
          placeholder: 'Buscar por nombre…',
        }}
      >
        <Combobox
          valueKey="id"
          aria-label="Filtrar por estado" className="w-auto min-w-[150px]"
          value={filterStatus} onChange={(value) => { setFilterStatus(value); setPage(0); }}
          options={[
            { id: '', label: 'Estado: Todos' },
            { id: 'active', label: 'Activo' },
            { id: 'inactive', label: 'Inactivo' },
          ]}
        />
      </FilterBar>

      <DataTable columns={columns} data={paginated} rowKey={(c) => c.id}
        emptyState={{ title: 'Sin clientes para los filtros seleccionados.' }} />

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Mostrando {paginated.length} de <span className="font-medium text-ink">{visible.length}</span>
        </span>
        <Pagination page={page} pageCount={pageCount}
          onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
      </div>
    </div>
  );
}
