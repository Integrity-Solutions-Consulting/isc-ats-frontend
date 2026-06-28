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
import { Combobox } from '@/design-system/molecules/Combobox';
import { Pagination } from '@/design-system/molecules/Pagination';
import { Select } from '@/design-system/atoms/Select';
import { Input } from '@/design-system/ui/input';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';
import { validateEmail, validateRequiredText } from '@/shared/validation';

interface Contact {
  id: string; firstName: string; lastName: string;
  email: string; clientCompany: string; clientCompanyId: string; is_active: boolean;
}
interface Company { id: number; name: string; is_active: boolean; }

const CONTACTS_KEY = ['org', 'contacts'];
const COMPANIES_KEY = ['org', 'client-companies'];
const INLINE = 'w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-ink shadow-sm outline-none transition-colors focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-1';

type EditForm = { firstName: string; lastName: string; email: string; clientCompanyId: string };

export function ContactosPage() {
  const qc = useQueryClient();
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: CONTACTS_KEY,
    queryFn: () => fetch('/api/org/contacts', { cache: 'no-store' }).then((r) => r.json() as Promise<Contact[]>),
  });
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: COMPANIES_KEY,
    queryFn: () => fetch('/api/org/client-companies', { cache: 'no-store' }).then((r) => r.json() as Promise<Company[]>),
  });

  const createMut = useMutation({
    mutationFn: async (form: EditForm) => {
      const res = await fetch('/api/org/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error creating contact');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: CONTACTS_KEY }); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...form }: EditForm & { id: string }) => {
      const res = await fetch(`/api/org/contacts/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error updating contact');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: CONTACTS_KEY }); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/org/contacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting contact');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: CONTACTS_KEY }); },
  });

  const firstCompanyId = companies[0] ? String(companies[0].id) : '';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ firstName: '', lastName: '', email: '', clientCompanyId: '' });
  const [showModal, setShowModal] = useState(false);
  const [newForm, setNewForm] = useState<EditForm>({ firstName: '', lastName: '', email: '', clientCompanyId: firstCompanyId });
  const [newTouched, setNewTouched] = useState<{ firstName?: boolean; email?: boolean }>({});
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const PAGE_SIZE = 10;

  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setEditForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, clientCompanyId: c.clientCompanyId });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => {
    if (!editingId) return;
    // Inline-edit validation: keep the row open if name/email are invalid.
    if (!editForm.firstName.trim() || validateEmail(editForm.email)) return;
    updateMut.mutate({ id: editingId, ...editForm });
    setEditingId(null);
  };

  // Live validation for the create modal — errors surface per field once touched.
  const newErrors = {
    firstName: validateRequiredText(newForm.firstName, 'El nombre', 80),
    email: validateEmail(newForm.email),
  };
  const showNewError = (field: 'firstName' | 'email') =>
    newTouched[field] ? newErrors[field] : undefined;
  const newFormValid = !newErrors.firstName && !newErrors.email;

  const openCreate = () => {
    setNewForm({ firstName: '', lastName: '', email: '', clientCompanyId: firstCompanyId });
    setNewTouched({});
    setShowModal(true);
  };

  const handleCreate = () => {
    setNewTouched({ firstName: true, email: true });
    if (!newFormValid) return;
    createMut.mutate(newForm, {
      onSuccess: () => {
        setNewForm({ firstName: '', lastName: '', email: '', clientCompanyId: firstCompanyId });
        setNewTouched({});
        setShowModal(false);
      },
    });
  };

  const visible = [...contacts].sort((a, b) => Number(b.id) - Number(a.id)).filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.firstName.toLowerCase().includes(q) && !c.lastName.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
    if (filterClient && c.clientCompany !== filterClient) return false;
    if (filterStatus === 'active' && !c.is_active) return false;
    if (filterStatus === 'inactive' && c.is_active) return false;
    if (!filterStatus && !c.is_active) return false;
    return true;
  });

  const pageCount = Math.ceil(visible.length / PAGE_SIZE);
  const paginated = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const clientNames = [...new Set(contacts.map((c) => c.clientCompany))];

  const columns: ColumnDef<Contact>[] = [
    {
      key: 'firstName', header: 'Nombres',
      render: (c) => c.id === editingId
        ? <input value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} className={INLINE} />
        : <span className="text-ink-muted">{c.firstName}</span>,
    },
    {
      key: 'lastName', header: 'Apellidos',
      render: (c) => c.id === editingId
        ? <input value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} className={INLINE} />
        : <span className="text-ink-muted">{c.lastName}</span>,
    },
    {
      key: 'clientCompany', header: 'Cliente',
      render: (c) => c.id === editingId
        ? (
          <Select value={editForm.clientCompanyId} onChange={(e) => setEditForm((f) => ({ ...f, clientCompanyId: e.target.value }))}>
            {companies.map((co) => <option key={co.id} value={String(co.id)}>{co.name}</option>)}
          </Select>
        )
        : <span className="text-ink-muted">{c.clientCompany}</span>,
    },
    {
      key: 'email', header: 'Correo',
      render: (c) => c.id === editingId
        ? <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className={INLINE} />
        : <span className="text-ink-muted">{c.email}</span>,
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
              <Button variant="ghost" size="icon" aria-label="Guardar" className="size-8" onClick={saveEdit}><Check className="size-4" /></Button>
              <Button variant="ghost" size="icon" aria-label="Cancelar" className="size-8" onClick={cancelEdit}><X className="size-4" /></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" aria-label="Editar" className="size-8" onClick={() => startEdit(c)}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" aria-label="Eliminar" className="size-8 text-danger hover:bg-danger/10 hover:text-danger" onClick={() => setDeleteTarget(c)}>
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-muted"><Loader2 className="size-4 animate-spin" /> Cargando contactos…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Contactos</h1>
        <Button onClick={openCreate}><Plus className="mr-1.5 size-4" />Nuevo contacto</Button>
      </div>

      <FilterBar search={{ value: search, onChange: (v) => { setSearch(v); setPage(0); }, placeholder: 'Buscar por nombre o correo…' }}>
        <Combobox
          valueKey="id"
          aria-label="Filtrar por cliente"
          className="w-auto min-w-[180px]"
          value={filterClient}
          onChange={(value) => { setFilterClient(value); setPage(0); }}
          options={[
            { id: '', label: 'Cliente: Todos' },
            ...clientNames.map((name) => ({ id: name, label: name })),
          ]}
        />
        <Combobox
          valueKey="id"
          aria-label="Filtrar por estado"
          className="w-auto min-w-[150px]"
          value={filterStatus}
          onChange={(value) => { setFilterStatus(value); setPage(0); }}
          options={[
            { id: '', label: 'Estado: Todos' },
            { id: 'active', label: 'Activo' },
            { id: 'inactive', label: 'Inactivo' },
          ]}
        />
      </FilterBar>

      <DataTable columns={columns} data={paginated} rowKey={(c) => c.id}
        rowClassName={(c) => (c.id === editingId ? 'bg-surface-2' : '')}
        emptyState={{ title: 'Sin contactos para los filtros seleccionados.' }} />

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>Mostrando {paginated.length} de <span className="font-medium text-ink">{visible.length}</span></span>
        <Pagination page={page} pageCount={pageCount} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-surface-2">
          <DialogHeader><DialogTitle>Nuevo contacto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Nombre</label>
                <Input value={newForm.firstName} onChange={(e) => setNewForm((f) => ({ ...f, firstName: e.target.value }))}
                  onBlur={() => setNewTouched((t) => ({ ...t, firstName: true }))}
                  aria-invalid={!!showNewError('firstName')}
                  className="mt-1.5" />
                {showNewError('firstName') && <p className="mt-1 text-xs text-danger">{showNewError('firstName')}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Apellido</label>
                <Input value={newForm.lastName} onChange={(e) => setNewForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="mt-1.5" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Correo electrónico</label>
              <Input type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))}
                onBlur={() => setNewTouched((t) => ({ ...t, email: true }))}
                aria-invalid={!!showNewError('email')}
                className="mt-1.5" />
              {showNewError('email') && <p className="mt-1 text-xs text-danger">{showNewError('email')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Cliente</label>
              <Select value={newForm.clientCompanyId} onChange={(e) => setNewForm((f) => ({ ...f, clientCompanyId: e.target.value }))}>
                {companies.map((co) => <option key={co.id} value={String(co.id)}>{co.name}</option>)}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newFormValid || createMut.isPending}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Crear contacto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="¿Eliminar contacto?"
        description={
          deleteTarget
            ? `El contacto ${deleteTarget.firstName} ${deleteTarget.lastName} se desactivará y dejará de estar disponible.`
            : undefined
        }
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => { if (deleteTarget) { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); } }}
      />
    </div>
  );
}
