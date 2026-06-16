'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Power, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/design-system/ui/badge';
import { Button } from '@/design-system/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/design-system/ui/dialog';
import { DataTable, type ColumnDef } from '@/design-system/organisms/DataTable';
import { FilterBar } from '@/design-system/molecules/FilterBar';
import { Combobox } from '@/design-system/molecules/Combobox';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';
import { Pagination } from '@/design-system/molecules/Pagination';
import { Select } from '@/design-system/atoms/Select';
import {
  createUser,
  listRoles,
  listUsers,
  setUserActive,
  type CreateUserPayload,
} from '../api/usersApi';
import type { PortalUser } from '../types';

const STATUS_LABEL: Record<PortalUser['status'], string> = {
  active: 'Activo',
  inactive: 'Inactivo',
};

const STATUS_VARIANT: Record<PortalUser['status'], 'success' | 'neutral'> = {
  active: 'success',
  inactive: 'neutral',
};

/** Read the current user's numeric id from the non-httpOnly session-user cookie. */
function readCurrentUserId(): number | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith('session-user='))
    ?.split('=')
    .slice(1)
    .join('=');
  if (!raw) return null;
  try {
    const decoded = JSON.parse(decodeURIComponent(raw)) as { userId?: number };
    return decoded.userId ?? null;
  } catch {
    return null;
  }
}

const EMPTY_FORM: CreateUserPayload & { confirmPassword: string } = {
  email: '',
  password: '',
  confirmPassword: '',
  role_id: 0,
  is_active: true,
};

export function UsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const { data: roles = [] } = useQuery({ queryKey: ['roles-simple'], queryFn: listRoles });

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  // Read the id from a client-only cookie post-mount; reading it during render
  // would cause a hydration mismatch (the server can't see this cookie).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only cookie sync, hydration-safe
  useEffect(() => { setCurrentUserId(readCurrentUserId()); }, []);

  // Create user modal state
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string; role?: string }>({});

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      setCreateError(null);
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
    },
    onError: (err: Error) => {
      setCreateError(err.message ?? 'No fue posible crear el usuario. Verificá los datos e intentá de nuevo.');
    },
  });

  // Activate/deactivate mutation
  const [toggleError, setToggleError] = useState<string | null>(null);
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setUserActive(id, isActive),
    onSuccess: () => {
      setToggleError(null);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      setToggleError(err.message ?? 'No fue posible actualizar el estado del usuario.');
    },
  });

  // Deactivation confirmation dialog
  const [confirmTarget, setConfirmTarget] = useState<PortalUser | null>(null);

  const handleToggle = (user: PortalUser) => {
    if (user.status === 'active') {
      setConfirmTarget(user);
    } else {
      toggleMutation.mutate({ id: user.id, isActive: true });
    }
  };

  const handleConfirmDeactivate = () => {
    if (confirmTarget) {
      toggleMutation.mutate({ id: confirmTarget.id, isActive: false });
      setConfirmTarget(null);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Derive unique role options from loaded users instead of a hardcoded array
  const roleOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const u of users) {
      if (u.role && u.role !== 'Sin rol') {
        for (const r of u.role.split(',')) {
          const trimmed = r.trim();
          if (trimmed) seen.add(trimmed);
        }
      }
    }
    return Array.from(seen).sort();
  }, [users]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (q && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (filterRole && !u.role.split(',').map((r) => r.trim()).includes(filterRole)) return false;
    if (filterStatus && u.status !== filterStatus) return false;
    return true;
  });

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: ColumnDef<PortalUser>[] = [
    {
      key: 'fullName',
      header: 'Usuario',
      render: (user) => <span className="font-medium text-ink">{user.fullName}</span>,
    },
    {
      key: 'email',
      header: 'Correo',
      render: (user) => <span className="text-ink-muted">{user.email}</span>,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => <span className="text-ink-muted">{user.role}</span>,
    },
    {
      key: 'lastAccessAt',
      header: 'Último acceso',
      render: (user) => (
        <span className="text-xs text-ink-muted">
          {user.lastAccessAt ? format(parseISO(user.lastAccessAt), 'd MMM yyyy HH:mm', { locale: es }) : '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (user) => (
        <span className="text-xs text-ink-muted">
          {format(parseISO(user.createdAt), 'd MMM yyyy', { locale: es })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (user) => (
        <Badge variant={STATUS_VARIANT[user.status]}>{STATUS_LABEL[user.status]}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 'w-16',
      render: (user) => {
        const isActive = user.status === 'active';
        const isSelf = currentUserId !== null && Number(user.id) === currentUserId;
        return (
          <div title={isSelf ? 'No podés desactivar tu propia cuenta' : undefined}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isActive ? 'Desactivar usuario' : 'Activar usuario'}
              className={
                isActive
                  ? 'size-8 text-danger hover:bg-danger/10 hover:text-danger'
                  : 'size-8 text-success hover:bg-success/10 hover:text-success'
              }
              disabled={toggleMutation.isPending || isSelf}
              onClick={() => handleToggle(user)}
            >
              {isActive ? <Trash2 className="size-4" /> : <Power className="size-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  function validateForm() {
    const errors: typeof formErrors = {};
    if (!form.email) errors.email = 'El correo es requerido.';
    if (!form.password || form.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    else if (form.password !== form.confirmPassword) errors.password = 'Las contraseñas no coinciden.';
    if (!form.role_id) errors.role = 'Seleccioná un rol.';
    return errors;
  }

  function handleSubmit() {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const { confirmPassword: _cp, ...payload } = form;
    createMutation.mutate(payload);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
        <Button onClick={() => { setShowModal(true); setCreateError(null); setFormErrors({}); setForm(EMPTY_FORM); }}>
          <Plus className="mr-1.5 size-4" />
          Nuevo usuario
        </Button>
      </div>

      {toggleError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{toggleError}</p>
      )}

      <FilterBar
        search={{
          value: search,
          onChange: (value) => { setSearch(value); setPage(0); },
          placeholder: 'Buscar por nombre o correo…',
        }}
      >
        <Combobox
          valueKey="id"
          aria-label="Filtrar por rol"
          className="w-auto min-w-[160px]"
          value={filterRole}
          onChange={(value) => { setFilterRole(value); setPage(0); }}
          options={[
            { id: '', label: 'Todos los roles' },
            ...roleOptions.map((r) => ({ id: r, label: r })),
          ]}
        />
        <Combobox
          valueKey="id"
          aria-label="Filtrar por estado"
          className="w-auto min-w-[150px]"
          value={filterStatus}
          onChange={(value) => { setFilterStatus(value); setPage(0); }}
          options={[
            { id: '', label: 'Todos los estados' },
            { id: 'active', label: 'Activo' },
            { id: 'inactive', label: 'Inactivo' },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={paginated}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        skeletonRows={4}
        emptyState={{ title: 'Sin usuarios para los filtros seleccionados.' }}
      />

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Mostrando {paginated.length} de{' '}
          <span className="font-medium text-ink">{filtered.length}</span> usuario
          {filtered.length !== 1 ? 's' : ''}
        </span>
        <Pagination
          page={page}
          pageCount={pageCount}
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>

      {/* Deactivation confirmation */}
      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}
        title="¿Desactivar usuario?"
        description={
          confirmTarget
            ? `El usuario ${confirmTarget.fullName} (${confirmTarget.email}) no podrá iniciar sesión hasta que sea reactivado.`
            : undefined
        }
        confirmLabel="Desactivar"
        variant="danger"
        onConfirm={handleConfirmDeactivate}
      />

      {/* Create user modal */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setCreateError(null); setFormErrors({}); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Definí el rol y la contraseña inicial. Podés activar la cuenta ahora o dejarla
              inactiva para habilitarla más tarde.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="usuario@integrity.com.ec"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              {formErrors.email && <p className="mt-1 text-xs text-danger">{formErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Contraseña inicial</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Confirmar contraseña</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repetir contraseña"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              {formErrors.password && <p className="mt-1 text-xs text-danger">{formErrors.password}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Rol</label>
              <Select
                value={form.role_id || ''}
                onChange={(e) => setForm((f) => ({ ...f, role_id: Number(e.target.value) }))}
              >
                <option value="">Seleccionar rol…</option>
                {/* Staff-only: the candidate role is portal-candidate, never assignable here. */}
                {roles
                  .filter((r) => !/candidat/i.test(r.name))
                  .map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
              {formErrors.role && <p className="mt-1 text-xs text-danger">{formErrors.role}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              <label htmlFor="is_active" className="text-sm text-ink">Activar cuenta inmediatamente</label>
            </div>
          </div>
          {createError && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {createError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando…' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
