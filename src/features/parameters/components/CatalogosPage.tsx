'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, X, Check, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Badge } from '@/design-system/ui/badge';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';
import { cn } from '@/shared/utils';

type CatalogType = { key: string; label: string; endpoint: 'parameters' | 'departments'; hasDescription?: boolean; hiddenCodes?: string[] };
type CatalogValue = { id: string; code?: string; name: string; description?: string; active: boolean };

const CATALOG_TYPES: CatalogType[] = [
  { key: 'department',     label: 'Departamentos',       endpoint: 'departments',  hasDescription: true },
  { key: 'stage',          label: 'Etapas de proceso',   endpoint: 'parameters', hiddenCodes: ['offer'] },
  { key: 'stage_status',   label: 'Sub-estados de etapa',endpoint: 'parameters' },
  { key: 'city',           label: 'Ciudades',            endpoint: 'parameters' },
  { key: 'career',         label: 'Carreras',            endpoint: 'parameters' },
  { key: 'title',          label: 'Títulos',             endpoint: 'parameters' },
  { key: 'education_level',label: 'Niveles de educación',endpoint: 'parameters' },
  { key: 'work_mode',      label: 'Modalidades',         endpoint: 'parameters' },
  { key: 'resource_level', label: 'Niveles de recurso',  endpoint: 'parameters' },
  { key: 'vacancy_name',   label: 'Plantillas de nombre',endpoint: 'parameters' },
  { key: 'vacancy_status', label: 'Estados de vacante',  endpoint: 'parameters' },
  { key: 'notification_channel', label: 'Canales notif.',endpoint: 'parameters' },
  { key: 'email_status',   label: 'Estados de email',    endpoint: 'parameters' },
];

type Filter = 'all' | 'active' | 'inactive';

interface BackendParam  { id: number; code: string; name: string; is_active: boolean; }
interface BackendDept   { id: number; name: string; description: string | null; is_active: boolean; }

function toValue(item: BackendParam | BackendDept): CatalogValue {
  return {
    id: String(item.id),
    name: item.name,
    active: item.is_active,
    code: 'code' in item ? item.code : undefined,
    description: 'description' in item ? (item.description ?? '') : undefined,
  };
}

async function fetchValues(type: CatalogType): Promise<CatalogValue[]> {
  const url = type.endpoint === 'departments'
    ? '/api/org/departments?include_inactive=true'
    : `/api/org/parameters?type=${type.key}&include_inactive=true`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = (await res.json()) as (BackendParam | BackendDept)[];
  return data.map(toValue);
}

export function CatalogosPage() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('department');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogValue | null>(null);

  const currentType = CATALOG_TYPES.find((t) => t.key === selectedType)!;
  const queryKey = ['org', 'catalog', selectedType];

  const { data: values = [], isLoading } = useQuery<CatalogValue[]>({
    queryKey,
    queryFn: () => fetchValues(currentType),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const url = currentType.endpoint === 'departments'
        ? `/api/org/departments/${id}`
        : `/api/org/parameters/${id}`;
      const body = currentType.endpoint === 'departments'
        ? { name, description }
        : { name };
      const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Error updating');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ['vacancies', 'catalogs'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const url = currentType.endpoint === 'departments'
        ? `/api/org/departments/${id}`
        : `/api/org/parameters/${id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
        throw new Error(data.detail || data.error || 'No se pudo eliminar el valor.');
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ['vacancies', 'catalogs'] });
    },
  });

  const reactivateMut = useMutation({
    mutationFn: async (id: string) => {
      const url = currentType.endpoint === 'departments'
        ? `/api/org/departments/${id}`
        : `/api/org/parameters/${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error('Error reactivating');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ['vacancies', 'catalogs'] });
    },
  });

  const createMut = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (currentType.endpoint === 'departments') {
        const res = await fetch('/api/org/departments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        });
        if (!res.ok) throw new Error('Error creating');
      } else {
        // Generate a code from the name (slugified)
        const code = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const res = await fetch('/api/org/parameters', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: selectedType, code, name }),
        });
        if (!res.ok) throw new Error('Error creating');
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
      void qc.invalidateQueries({ queryKey: ['vacancies', 'catalogs'] });
      setNewValue('');
      setNewDescription('');
      setShowAdd(false);
    },
  });

  const filtered = values.filter((v) => {
    if (currentType.hiddenCodes?.includes(v.code ?? '')) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active' && !v.active) return false;
    if (filter === 'inactive' && v.active) return false;
    return true;
  });

  const selectType = (key: string) => {
    setSelectedType(key);
    setFilter('all');
    setSearch('');
    setEditingId(null);
    setShowAdd(false);
    deleteMut.reset();
  };

  const saveEdit = (id: string) => {
    if (!editingName.trim()) return; // keep editing if the name was cleared
    updateMut.mutate({ id, name: editingName.trim(), description: editingDescription.trim() });
    setEditingId(null);
  };

  const colSpan = currentType.hasDescription ? 4 : 3;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">Catálogos</h1>

      <div className="flex gap-4 overflow-hidden rounded-lg border border-border bg-surface shadow-sm" style={{ minHeight: 480 }}>
        {/* Type list */}
        <div className="w-56 shrink-0 overflow-auto border-r border-border py-2">
          {CATALOG_TYPES.map((type) => (
            <button key={type.key} type="button" onClick={() => selectType(type.key)}
              className={cn('w-full px-4 py-2 text-left text-sm transition-colors',
                selectedType === type.key ? 'bg-primary-50 font-medium text-primary-700' : 'text-ink hover:bg-surface-2')}>
              {type.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex h-8 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3 text-xs focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-1">
              <Search className="size-3.5 shrink-0 text-ink-subtle" />
              <input type="search" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle" />
            </div>
            {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  filter === f ? 'bg-primary-600 text-white' : 'bg-surface text-ink-muted hover:bg-primary-50 hover:text-primary-700')}>
                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
            <Button size="sm" onClick={() => setShowAdd(true)} className="ml-auto">
              <Plus className="mr-1 size-3.5" />Nuevo valor
            </Button>
          </div>

          {showAdd && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-primary-300 bg-primary-50 px-3 py-2">
              <input autoFocus type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createMut.mutate({ name: newValue.trim(), description: newDescription.trim() }); if (e.key === 'Escape') { setShowAdd(false); setNewValue(''); } }}
                placeholder="Nombre…" className="w-48 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle" />
              {currentType.hasDescription && (
                <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descripción (opcional)…" className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle" />
              )}
              <Button size="sm" onClick={() => createMut.mutate({ name: newValue.trim(), description: newDescription.trim() })}
                disabled={!newValue.trim() || createMut.isPending}>
                {createMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Agregar'}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Cancelar" className="size-7" onClick={() => { setShowAdd(false); setNewValue(''); }}>
                <X className="size-3.5" />
              </Button>
            </div>
          )}

          {deleteMut.isError && (
            <p className="mb-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {(deleteMut.error as Error).message}
            </p>
          )}

          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted">Nombre</th>
                  {currentType.hasDescription && <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted">Descripción</th>}
                  <th className="px-4 py-2 text-left text-xs font-semibold text-ink-muted">Estado</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-ink-subtle">
                    <Loader2 className="inline size-4 animate-spin mr-2" />Cargando…
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-ink-subtle">Sin valores.</td></tr>
                ) : filtered.map((v) => (
                  <tr key={v.id} className={cn('border-b border-border last:border-0',
                    editingId === v.id ? 'bg-surface-2' : 'hover:bg-primary-50/30')}>
                    <td className="px-4 py-2.5">
                      {editingId === v.id ? (
                        <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(v.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-ink shadow-sm outline-none transition-colors focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1" />
                      ) : (
                        <span className={cn('text-sm', !v.active && 'text-ink-subtle line-through')}>{v.name}</span>
                      )}
                    </td>
                    {currentType.hasDescription && (
                      <td className="px-4 py-2.5">
                        {editingId === v.id ? (
                          <input value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(v.id); if (e.key === 'Escape') setEditingId(null); }}
                            placeholder="Descripción…"
                            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-ink shadow-sm outline-none transition-colors placeholder:text-ink-subtle focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1" />
                        ) : (
                          <span className="text-sm text-ink-muted">{v.description || '—'}</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <Badge variant={v.active ? 'success' : 'neutral'}>{v.active ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === v.id ? (
                          <>
                            <Button size="icon" aria-label="Guardar" className="size-7" onClick={() => saveEdit(v.id)}><Check className="size-3.5" /></Button>
                            <Button variant="ghost" size="icon" aria-label="Cancelar" className="size-7" onClick={() => setEditingId(null)}><X className="size-3.5" /></Button>
                          </>
                        ) : !v.active ? (
                          <Button variant="ghost" size="icon" aria-label="Reactivar" className="size-7 text-success hover:bg-success/10"
                            onClick={() => reactivateMut.mutate(v.id)}>
                            <RefreshCw className="size-3.5" />
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" aria-label="Editar" className="size-7"
                              onClick={() => { setEditingId(v.id); setEditingName(v.name); setEditingDescription(v.description ?? ''); }}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Eliminar" className="size-7 text-danger hover:bg-danger/10"
                              onClick={() => setDeleteTarget(v)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="¿Eliminar valor?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" se desactivará. Si está en uso por algún registro activo, no se podrá eliminar.`
            : undefined
        }
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => { if (deleteTarget) { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); } }}
      />
    </div>
  );
}
