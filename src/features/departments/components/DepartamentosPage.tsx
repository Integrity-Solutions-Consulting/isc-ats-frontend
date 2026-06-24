'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Badge } from '@/design-system/ui/badge';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';

interface Department { id: string; name: string; is_active: boolean; }

const QUERY_KEY = ['org', 'departments'];

async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch('/api/org/departments', { cache: 'no-store' });
  if (!res.ok) throw new Error('Error loading departments');
  return res.json() as Promise<Department[]>;
}

function DepDrawer({
  dept, onClose, onSave, isPending,
}: {
  dept: Department | null;
  onClose: () => void;
  onSave: (name: string) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(dept?.name ?? '');
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-80 flex-col border-l border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-ink">{dept ? 'Editar departamento' : 'Nuevo departamento'}</h2>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}><X className="size-4" /></Button>
        </div>
        <div className="flex-1 p-5">
          <label className="mb-1 block text-sm font-medium text-ink">Nombre</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)} autoFocus
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={() => { onSave(name); }} disabled={!name.trim() || isPending}>
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : (dept ? 'Guardar' : 'Crear')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DepartamentosPage() {
  const qc = useQueryClient();
  const { data: depts = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: fetchDepartments });

  const createMut = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/org/departments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Error creating department');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/org/departments/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Error updating department');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/org/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting department');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const reactivateMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/org/departments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error('Error reactivating department');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const [drawer, setDrawer] = useState<Department | null | 'new'>(null);
  const [confirmTarget, setConfirmTarget] = useState<Department | null>(null);

  const handleSave = (name: string) => {
    if (!name.trim()) return;
    if (drawer === 'new') {
      createMut.mutate(name, { onSuccess: () => setDrawer(null) });
    } else if (drawer) {
      updateMut.mutate({ id: drawer.id, name }, { onSuccess: () => setDrawer(null) });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted">
        <Loader2 className="size-4 animate-spin" /> Cargando departamentos…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Departamentos</h1>
        <Button onClick={() => setDrawer('new')}><Plus className="mr-1.5 size-4" />Nuevo departamento</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-primary-50/40">
                <td className="px-4 py-3 font-medium text-ink">{d.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={d.is_active ? 'success' : 'neutral'}>{d.is_active ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDrawer(d)}>Editar</Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => d.is_active ? setConfirmTarget(d) : reactivateMut.mutate(d.id)}
                      disabled={deleteMut.isPending || reactivateMut.isPending}
                    >
                      {d.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer !== null && (
        <DepDrawer
          dept={drawer === 'new' ? null : drawer}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          isPending={createMut.isPending || updateMut.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}
        title="¿Desactivar departamento?"
        description={
          confirmTarget
            ? `El departamento ${confirmTarget.name} se desactivará y dejará de estar disponible.`
            : undefined
        }
        confirmLabel="Desactivar"
        variant="danger"
        onConfirm={() => { if (confirmTarget) { deleteMut.mutate(confirmTarget.id); setConfirmTarget(null); } }}
      />
    </div>
  );
}
