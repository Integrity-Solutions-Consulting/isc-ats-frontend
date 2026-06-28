'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Badge } from '@/design-system/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/design-system/ui/dialog';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { Pagination } from '@/design-system/molecules/Pagination';
import { Combobox } from '@/design-system/molecules/Combobox';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';
import { Input } from '@/design-system/ui/input';

interface Client { id: string; name: string; is_active: boolean; }

const QUERY_KEY = ['org', 'client-companies'];
const INLINE_INPUT = 'w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-ink shadow-sm outline-none transition-colors focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1';

async function fetchClients(): Promise<Client[]> {
  const res = await fetch('/api/org/client-companies', { cache: 'no-store' });
  if (!res.ok) throw new Error('Error loading clients');
  return res.json() as Promise<Client[]>;
}

export function ClientesPage() {
  const qc = useQueryClient();
  const { data: clients = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: fetchClients });

  const createMut = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/org/client-companies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Error creating client');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/org/client-companies/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Error updating client');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/org/client-companies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting client');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const PAGE_SIZE = 10;

  const startEdit = (c: Client) => { setEditingId(c.id); setEditName(c.name); };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => {
    if (!editingId) return;
    if (!editName.trim()) return; // keep editing if the name was cleared
    updateMut.mutate({ id: editingId, name: editName.trim() });
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMut.mutate(newName.trim());
    setNewName('');
    setShowModal(false);
  };

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
      render: (c) => c.id === editingId
        ? <input value={editName} onChange={(e) => setEditName(e.target.value)} className={INLINE_INPUT} autoFocus />
        : <span className="font-medium text-ink">{c.name}</span>,
    },
    {
      key: 'status', header: 'Estado',
      render: (c) => <Badge variant={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions', header: '', align: 'right', width: 'w-24',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          {c.id === editingId ? (
            <>
              <Button variant="ghost" size="icon" aria-label="Guardar" className="size-8" onClick={saveEdit}>
                <Check className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Cancelar" className="size-8" onClick={cancelEdit}>
                <X className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" aria-label="Editar" className="size-8" onClick={() => startEdit(c)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost" size="icon" aria-label="Eliminar"
                className="size-8 text-danger hover:bg-danger/10 hover:text-danger"
                onClick={() => setDeleteTarget(c)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      ),
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
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-1.5 size-4" />Nuevo cliente
        </Button>
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
        rowClassName={(c) => (c.id === editingId ? 'bg-surface-2' : '')}
        emptyState={{ title: 'Sin clientes para los filtros seleccionados.' }} />

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Mostrando {paginated.length} de <span className="font-medium text-ink">{visible.length}</span>
        </span>
        <Pagination page={page} pageCount={pageCount}
          onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-surface-2">
          <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Nombre comercial</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1.5" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createMut.isPending}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="¿Desactivar cliente?"
        description={
          deleteTarget
            ? `El cliente ${deleteTarget.name} se desactivará y dejará de estar disponible para nuevas vacantes.`
            : undefined
        }
        confirmLabel="Desactivar"
        variant="danger"
        onConfirm={() => { if (deleteTarget) { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); } }}
      />
    </div>
  );
}
