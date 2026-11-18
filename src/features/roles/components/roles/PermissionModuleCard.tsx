import { AlertTriangle, Info } from 'lucide-react';
import { Popover } from 'radix-ui';
import { cn } from '@/shared/utils';
import { Card } from '@/design-system/ui/card';
import { type ModuleGroup } from './permissions';
import { moduleGranted } from './helpers';

const MODULE_DESCRIPTIONS: Record<string, string> = {
  recruitment: 'Controla las acciones disponibles sobre vacantes, candidatos, postulaciones y entrevistas.',
  org: 'Controla la gestión de catálogos, clientes, contactos, procesos y plantillas.',
  talent: 'Controla el acceso y las acciones sobre los registros del banco de talento.',
  comms: 'Controla el acceso a notificaciones y registros de correo.',
  storage: 'Controla las acciones disponibles sobre los archivos.',
  ai: 'Controla el acceso al procesamiento de hojas de vida, imágenes promocionales y registros de uso de IA.',
  auth: 'Controla la administración de usuarios, roles, permisos y accesos.',
};

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
        {MODULE_DESCRIPTIONS[mod.key] && (
          <Popover.Root>
            <Popover.Trigger asChild>
              <button type="button" aria-label={`Información sobre ${mod.label}`} className="rounded text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                <Info className="size-4" aria-hidden="true" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content sideOffset={6} className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface p-3 text-sm text-ink shadow-lg">
                <p>{MODULE_DESCRIPTIONS[mod.key]}</p>
                <p className="mt-2 text-xs text-ink-muted">Activa cada acción para concederla al rol. Guarda los cambios para aplicarlos.</p>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
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
