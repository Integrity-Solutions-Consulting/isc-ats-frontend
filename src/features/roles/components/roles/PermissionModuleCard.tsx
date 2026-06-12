import { AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils';
import { type ModuleDef } from './permissions';
import { type Role } from './mockRoles';
import { moduleGranted } from './helpers';

export function PermissionModuleCard({ mod, role, onTogglePerm, onToggleModule }: {
  mod: ModuleDef;
  role: Role;
  onTogglePerm: (permId: string, checked: boolean) => void;
  onToggleModule: (mod: ModuleDef, enable: boolean) => void;
}) {
  const state = moduleGranted(role, mod);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      {/* Module header */}
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold', mod.accent)}>
          {mod.label[0]}
        </span>
        <span className="flex-1 text-sm font-semibold text-ink">{mod.label}</span>
        <button
          type="button"
          disabled={role.isSystem}
          onClick={() => onToggleModule(mod, state !== 'all')}
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-40',
            state === 'all'
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              : state === 'partial'
                ? 'bg-warning/10 text-warning hover:bg-warning/20'
                : 'bg-surface-2 text-ink-subtle hover:bg-surface-2',
          )}
        >
          {state === 'all' ? 'todos' : state === 'partial' ? 'parciales' : 'ninguno'}
        </button>
      </div>

      {/* Permission items */}
      <div className="flex flex-col gap-1.5">
        {mod.permissions.map((perm) => {
          const checked = role.permissionIds.has(perm.id);
          return (
            <label
              key={perm.id}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                checked ? 'bg-primary-50 text-ink' : 'text-ink-muted hover:bg-surface-2',
                role.isSystem && 'pointer-events-none',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={role.isSystem}
                onChange={(e) => onTogglePerm(perm.id, e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-300"
              />
              <span className="flex-1">{perm.label}</span>
              {perm.dangerous && (
                <AlertTriangle className="size-3.5 shrink-0 text-danger" />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
