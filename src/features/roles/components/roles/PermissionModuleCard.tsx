import { AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Card } from '@/design-system/ui/card';
import { type ModuleGroup } from './permissions';
import { moduleGranted } from './helpers';

export function PermissionModuleCard({
  mod,
  granted,
  onTogglePerm,
  onToggleModule,
  disabled = false,
}: {
  mod: ModuleGroup;
  granted: Set<string>;
  onTogglePerm: (code: string, checked: boolean) => void;
  onToggleModule: (mod: ModuleGroup, enable: boolean) => void;
  disabled?: boolean;
}) {
  const state = moduleGranted(granted, mod);

  return (
    <Card padding="sm">
      {/* Module header */}
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
        <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold', mod.accent)}>
          {mod.label[0]}
        </span>
        <span className="flex-1 text-sm font-semibold text-ink">{mod.label}</span>
        <button
          type="button"
          onClick={() => onToggleModule(mod, state !== 'all')}
          disabled={disabled}
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

      {/* Resources with their action chips */}
      <div className="flex flex-col gap-2.5">
        {mod.resources.map((resource) => (
          <div key={resource.key} className="flex items-start gap-3">
            <span className="mt-1 w-40 shrink-0 text-sm text-ink-muted">{resource.label}</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {resource.permissions.map((perm) => {
                const checked = granted.has(perm.code);
                return (
                  <button
                    key={perm.code}
                    type="button"
                    disabled={disabled}
                    onClick={() => onTogglePerm(perm.code, !checked)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                      disabled && 'cursor-not-allowed opacity-60',
                      checked
                        ? perm.dangerous
                          ? 'border-danger/40 bg-danger/10 text-danger'
                          : 'border-primary-200 bg-primary-100 text-primary-700'
                        : 'border-border bg-surface text-ink-subtle hover:bg-surface-2',
                    )}
                  >
                    {perm.dangerous && checked && <AlertTriangle className="size-3 shrink-0" />}
                    {perm.actionLabel}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
