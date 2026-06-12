import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { MODULES, type ModuleDef, TOTAL_PERMS } from './permissions';
import { type Role } from './mockRoles';
import { PermissionModuleCard } from './PermissionModuleCard';

export function RoleEditor({
  role,
  dirty,
  onUpdate,
  onTogglePerm,
  onToggleModule,
  onDiscard,
  onDelete,
  onSave,
}: {
  role: Role;
  dirty: boolean;
  onUpdate: (patch: Partial<Omit<Role, 'id'>>) => void;
  onTogglePerm: (permId: string, checked: boolean) => void;
  onToggleModule: (mod: ModuleDef, enable: boolean) => void;
  onDiscard: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Role name + description */}
      <div className="flex items-end gap-4 border-b border-border bg-surface p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Nombre del rol</label>
          <input
            value={role.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            disabled={role.isSystem}
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Descripción</label>
          <input
            value={role.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            disabled={role.isSystem}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50"
          />
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-md border border-border px-3 py-1.5 text-center">
          <span className="text-xs text-ink-muted">permisos</span>
          <span className="text-sm font-semibold text-ink">{role.permissionIds.size} / {TOTAL_PERMS}</span>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-md border border-border px-3 py-1.5 text-center">
          <span className="text-xs text-ink-muted">usuarios</span>
          <span className="text-sm font-semibold text-ink">{role.usersCount}</span>
        </div>
      </div>

      {/* Permissions grid */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-4">
          {MODULES.map((mod) => (
            <PermissionModuleCard
              key={mod.id}
              mod={mod}
              role={role}
              onTogglePerm={onTogglePerm}
              onToggleModule={onToggleModule}
            />
          ))}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 border-t border-border bg-surface px-5 py-3">
        {dirty && (
          <span className="text-xs text-ink-muted">
            <span className="text-warning">●</span> Cambios sin guardar
            {role.usersCount > 0 && ` · se aplican a ${role.usersCount} usuario${role.usersCount !== 1 ? 's' : ''} al guardar`}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={onDiscard} disabled={!dirty || role.isSystem}>
            Descartar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            disabled={role.isSystem || role.usersCount > 0}
            onClick={onDelete}
            title={role.usersCount > 0 ? 'No se puede eliminar: tiene usuarios asignados' : undefined}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Eliminar rol
          </Button>
          <Button size="sm" disabled={role.isSystem || !dirty} onClick={onSave}>
            <Save className="mr-1.5 size-3.5" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
