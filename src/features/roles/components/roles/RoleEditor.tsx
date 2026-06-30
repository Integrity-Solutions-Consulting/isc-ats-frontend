import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { Input } from '@/design-system/ui/input';
import { type ModuleGroup } from './permissions';
import { type Role } from './mockRoles';
import { PermissionModuleCard } from './PermissionModuleCard';

export function RoleEditor({
  role,
  modules,
  totalPerms,
  dirty,
  onUpdate,
  onTogglePerm,
  onToggleModule,
  onDiscard,
  onDelete,
  onSave,
}: {
  role: Role;
  modules: ModuleGroup[];
  totalPerms: number;
  dirty: boolean;
  onUpdate: (patch: Partial<Omit<Role, 'id'>>) => void;
  onTogglePerm: (code: string, checked: boolean) => void;
  onToggleModule: (mod: ModuleGroup, enable: boolean) => void;
  onDiscard: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Role name + description */}
      <div className="flex items-end gap-4 border-b border-border bg-surface-2 p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Nombre del rol</label>
          <Input
            value={role.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            disabled={role.isSystem}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-ink-muted">Descripción</label>
          <Input
            value={role.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            disabled={role.isSystem}
            className="w-full"
          />
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-md border border-border px-3 py-1.5 text-center">
          <span className="text-xs text-ink-muted">permisos</span>
          <span className="text-sm font-semibold text-ink">{role.permissionIds.size} / {totalPerms}</span>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-md border border-border px-3 py-1.5 text-center">
          <span className="text-xs text-ink-muted">usuarios</span>
          <span className="text-sm font-semibold text-ink">{role.usersCount}</span>
        </div>
      </div>

      {role.isSystem && (
        <div className="border-b border-border bg-surface px-5 py-2 text-xs text-ink-muted">
          Este es un rol del sistema: sus permisos son fijos y no pueden modificarse.
        </div>
      )}

      {/* Permissions grid */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {modules.map((mod) => (
            <PermissionModuleCard
              key={mod.key}
              mod={mod}
              granted={role.permissionIds}
              onTogglePerm={onTogglePerm}
              onToggleModule={onToggleModule}
              disabled={role.isSystem}
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
          <Button variant="outline" size="sm" onClick={onDiscard} disabled={!dirty}>
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
          <Button size="sm" disabled={!dirty} onClick={onSave}>
            <Save className="mr-1.5 size-3.5" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
