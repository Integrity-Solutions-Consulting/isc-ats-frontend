import { cn } from '@/shared/utils';
import { type Role } from './mockRoles';
import { permFraction } from './helpers';

export function RoleList({ roles, selectedId, totalPerms, onSelect }: {
  roles: Role[];
  selectedId: string;
  totalPerms: number;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-border">
      {roles.map((role) => {
        const pct = permFraction(role.permissionIds.size, totalPerms);
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            className={cn(
              'w-full border-b border-border px-4 py-3 text-left transition-colors last:border-0',
              selectedId === role.id ? 'bg-primary-50' : 'hover:bg-surface-2',
            )}
          >
            <div className="flex items-center gap-2">
              <p className="flex-1 truncate text-sm font-medium text-ink">{role.name}</p>
              {role.isSystem && (
                <span className="rounded border border-border px-1 text-[10px] text-ink-subtle">
                  sistema
                </span>
              )}
            </div>
            {role.description && (
              <p className="mt-0.5 truncate text-xs text-ink-muted">{role.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="shrink-0 text-xs text-ink-subtle">
                {role.permissionIds.size}/{totalPerms}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-subtle">{role.usersCount} usuario{role.usersCount !== 1 ? 's' : ''}</p>
          </button>
        );
      })}
    </aside>
  );
}
