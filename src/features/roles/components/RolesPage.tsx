'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, AlertCircle, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import {
  buildPermissionTree,
  moduleCodes,
  countPermissions,
  type ModuleGroup,
} from './roles/permissions';
import { type Role } from './roles/mockRoles';
import { RoleList } from './roles/RoleList';
import { RoleEditor } from './roles/RoleEditor';
import {
  useRoles,
  usePermissionCatalog,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../hooks/useRoles';

function copyRole(r: Role): Role {
  return { ...r, permissionIds: new Set(r.permissionIds) };
}

export function RolesPage() {
  const { data: roles = [], isLoading, error } = useRoles();
  const { data: catalog = [], isLoading: catalogLoading } = usePermissionCatalog();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const modules = useMemo(() => buildPermissionTree(catalog), [catalog]);
  const totalPerms = useMemo(() => countPermissions(modules), [modules]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [draftRole, setDraftRole] = useState<Role | null>(null);
  const [dirty, setDirty] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default selection when roles list is loaded. Intentional server→local sync.
  useEffect(() => {
    if (roles.length > 0 && !selectedId) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedId(roles[0].id);
      setDraftRole(copyRole(roles[0]));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [roles, selectedId]);

  // Sync draft if roles list changes from mutation successes
  useEffect(() => {
    if (selectedId && roles.length > 0) {
      const activeRole = roles.find((r) => r.id === selectedId);
      if (activeRole && !dirty) {
        // Re-sync the editable draft when the roles list refetches after a
        // mutation. Intentional server→local sync; not a render derivation.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraftRole(copyRole(activeRole));
      }
    }
  }, [roles, selectedId, dirty]);

  function updateRoleDraft(patch: Partial<Omit<Role, 'id'>>) {
    if (!draftRole) return;
    setDraftRole((prev) => {
      if (!prev) return null;
      return { ...prev, ...patch };
    });
    setDirty(true);
  }

  function togglePerm(code: string, checked: boolean) {
    if (!draftRole) return;
    const next = new Set(draftRole.permissionIds);
    if (checked) next.add(code);
    else next.delete(code);
    updateRoleDraft({ permissionIds: next });
  }

  function toggleModule(mod: ModuleGroup, enable: boolean) {
    if (!draftRole) return;
    const next = new Set(draftRole.permissionIds);
    moduleCodes(mod).forEach((code) => {
      if (enable) next.add(code);
      else next.delete(code);
    });
    updateRoleDraft({ permissionIds: next });
  }

  async function createNewRole() {
    setErrorMsg(null);
    try {
      const newRole = await createMutation.mutateAsync({
        name: 'Nuevo rol',
        description: '',
      });
      setSelectedId(newRole.id);
      setDraftRole(newRole);
      setDirty(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al crear el rol');
    }
  }

  function discardChanges() {
    const original = roles.find((r) => r.id === selectedId);
    if (original) {
      setDraftRole(copyRole(original));
    }
    setDirty(false);
  }

  async function saveChanges() {
    if (!draftRole || !selectedId) return;
    setErrorMsg(null);
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        data: {
          name: draftRole.name,
          description: draftRole.description,
          permissionIds: Array.from(draftRole.permissionIds),
        },
      });
      setDirty(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al guardar el rol');
    }
  }

  async function deleteCurrentRole() {
    if (!selectedId) return;
    setErrorMsg(null);
    try {
      await deleteMutation.mutateAsync(selectedId);
      const remaining = roles.filter((r) => r.id !== selectedId);
      const nextSelected = remaining[0]?.id ?? '';
      setSelectedId(nextSelected);
      if (nextSelected) {
        setDraftRole(copyRole(remaining[0]));
      } else {
        setDraftRole(null);
      }
      setDirty(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al eliminar el rol');
    }
  }

  function selectRole(id: string) {
    if (dirty && !confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?')) {
      return;
    }
    const role = roles.find((r) => r.id === id);
    if (role) {
      setSelectedId(id);
      setDraftRole(copyRole(role));
      setDirty(false);
    }
  }

  if ((isLoading && roles.length === 0) || (catalogLoading && catalog.length === 0)) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="flex items-center gap-3 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          No se pudo cargar los roles. Verificá tu conexión e intentá de nuevo.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-ink">Roles y permisos</h1>
        <Button size="sm" className="ml-auto" onClick={createNewRole} disabled={createMutation.isPending}>
          <Plus className="mr-1.5 size-4" />
          Nuevo rol
        </Button>
      </div>

      {/* Inline error banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="ml-auto shrink-0">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div
        className="flex flex-1 overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
        style={{ minHeight: 520 }}
      >
        <RoleList roles={roles} selectedId={selectedId} totalPerms={totalPerms} onSelect={selectRole} />

        {draftRole && (
          <RoleEditor
            role={draftRole}
            modules={modules}
            totalPerms={totalPerms}
            dirty={dirty}
            onUpdate={updateRoleDraft}
            onTogglePerm={togglePerm}
            onToggleModule={toggleModule}
            onDiscard={discardChanges}
            onDelete={deleteCurrentRole}
            onSave={saveChanges}
          />
        )}
      </div>
    </div>
  );
}
