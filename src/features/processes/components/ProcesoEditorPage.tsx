'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { ConfirmDialog } from '@/design-system/molecules/ConfirmDialog';
import { cn } from '@/shared/utils';
import {
  deleteProcess,
  getProcess,
  saveProcess,
  type Process,
  type ProcessStage,
} from '../api/processesApi';

const FIXED_FINAL: Omit<ProcessStage, 'id'> = { name: 'Oferta · Contratación', type: 'final' };
const FIXED_REJECTED: Omit<ProcessStage, 'id'> = { name: 'Rechazados', type: 'rejected' };
import { useBreadcrumbStore } from '@/shared/stores/breadcrumbStore';
import { ROUTES } from '@/shared/constants/routes';

const stageCardStyle = (type: ProcessStage['type']) =>
  type === 'final'
    ? 'border-primary-400 bg-primary-50'
    : type === 'rejected'
      ? 'border-danger/40 bg-danger/5'
      : 'border-border bg-surface';

interface Props {
  id: string | null;
}

export function ProcesoEditorPage({ id }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const generatedId = useId();
  const isNew = id === null;
  const stageCounter = useRef(0);

  const { data: clients = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['org', 'client-companies'],
    queryFn: () => fetch('/api/org/client-companies', { cache: 'no-store' }).then((r) => r.json()),
  });
  const { data: departments = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['org', 'departments'],
    queryFn: () => fetch('/api/org/departments', { cache: 'no-store' }).then((r) => r.json()),
  });
  const { data: stageParams = [] } = useQuery<{ id: number; code: string; name: string }[]>({
    queryKey: ['org', 'stages', 'palette'],
    queryFn: () => fetch('/api/org/parameters?type=stage', { cache: 'no-store' }).then((r) => r.json()),
  });

  // Fixed stages are always appended at save time and shown non-removable.
  // Filter out 'offer' code so it doesn't appear in the palette.
  const paletteStages: Omit<ProcessStage, 'id'>[] = stageParams
    .filter((p) => p.code !== 'offer')
    .map((p) => ({ name: p.name, type: 'normal' as const }));

  const [saved, setSaved] = useState<Process | null>(null);
  const [draft, setDraft] = useState<Process>(() => ({
    id: `local-${generatedId}`,
    name: '',
    clientCompany: '',
    department: '',
    stages: [],
    isActive: true,
  }));
  const [editing, setEditing] = useState(isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const setPageTitle = useBreadcrumbStore((s) => s.setPageTitle);

  useEffect(() => {
    if (!id) return;
    getProcess(id).then((p) => {
      if (p) {
        const normalOnly = { ...p, stages: p.stages.filter((s) => s.type === 'normal') };
        setSaved(normalOnly);
        setDraft(normalOnly);
        setPageTitle(p.name);
      } else {
        router.replace(ROUTES.configuracion.procesos);
      }
    });
    return () => setPageTitle(null);
  }, [id, router, setPageTitle]);

  const update = <K extends keyof Process>(field: K, value: Process[K]) =>
    setDraft((p) => ({ ...p, [field]: value }));

  const addStage = (template: Omit<ProcessStage, 'id'>) =>
    update('stages', [...draft.stages, { id: `s${++stageCounter.current}`, ...template }]);

  const removeStage = (stageId: string) =>
    update('stages', draft.stages.filter((s) => s.id !== stageId));

  const handleEdit = () => { setDraft(saved ?? draft); setEditing(true); };

  const handleDiscard = () => {
    if (isNew) { router.push(ROUTES.configuracion.procesos); return; }
    setDraft(saved!);
    setEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const withFixed: Process = {
      ...draft,
      stages: [
        ...draft.stages,
        { id: 'fixed-final', ...FIXED_FINAL },
        { id: 'fixed-rejected', ...FIXED_REJECTED },
      ],
    };
    await saveProcess(withFixed);
    setSaved(draft);
    setIsSaving(false);
    setEditing(false);
    if (isNew) router.push(ROUTES.configuracion.procesos);
  };

  const handleDelete = async () => {
    if (!id) return;
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!id) return;
    await deleteProcess(id);
    router.push(ROUTES.configuracion.procesos);
  };

  const handleReactivate = async () => {
    if (!saved || !id) return;
    setIsSaving(true);
    const withFixed: Process = {
      ...saved,
      isActive: true,
      stages: [
        ...saved.stages,
        { id: 'fixed-final', ...FIXED_FINAL },
        { id: 'fixed-rejected', ...FIXED_REJECTED },
      ],
    };
    await saveProcess(withFixed);
    setSaved({ ...saved, isActive: true });
    setDraft({ ...draft, isActive: true });
    queryClient.removeQueries({ queryKey: ['processes'] });
    setIsSaving(false);
  };

  const usedNames = new Set(draft.stages.map((s) => s.name));
  const display = editing ? draft : (saved ?? draft);

  return (
    <>
    <div className="flex flex-1 flex-col gap-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        {!editing && (
          <Button variant="ghost" size="icon" asChild aria-label="Volver">
            <Link href={ROUTES.configuracion.procesos}><ArrowLeft /></Link>
          </Button>
        )}

        <div className="flex-1">
          {editing ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted">Cliente</label>
                <select value={draft.clientCompany} onChange={(e) => update('clientCompany', e.target.value)}
                  className="h-9 rounded-md border border-border bg-bg px-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300">
                  <option value="">Selecciona…</option>
                  {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted">Departamento</label>
                <select value={draft.department} onChange={(e) => update('department', e.target.value)}
                  className="h-9 rounded-md border border-border bg-bg px-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300">
                  <option value="">Selecciona…</option>
                  {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-xs text-ink-muted">Nombre del proceso</label>
                <input value={draft.name} onChange={(e) => update('name', e.target.value)}
                  placeholder="Ej: BG · Tecnología — Estándar 5 etapas"
                  className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-ink-subtle" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-ink">{display.name}</h1>
                {saved && !saved.isActive && (
                  <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-muted">{display.clientCompany} · {display.department}</p>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-2">
            {id && saved && !saved.isActive ? (
              <Button size="sm" onClick={handleReactivate} disabled={isSaving}>
                <RefreshCw className="mr-1.5 size-3.5" />Reactivar
              </Button>
            ) : (
              <>
                {id && (
                  <Button variant="outline" size="sm"
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={handleDelete}>
                    <Trash2 className="mr-1.5 size-3.5" />Eliminar
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="mr-1.5 size-3.5" />Editar
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex gap-4">

        {/* Palette — edit mode only */}
        {editing && (
          <div className="flex w-56 shrink-0 flex-col gap-1 overflow-auto rounded-lg border border-border bg-surface-2 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Etapas disponibles
            </p>
            {paletteStages.map((stage) => {
              const alreadyUsed = usedNames.has(stage.name);
              return (
                <button key={stage.name} type="button"
                  onClick={() => !alreadyUsed && addStage(stage)}
                  disabled={alreadyUsed}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors',
                    alreadyUsed
                      ? 'cursor-not-allowed opacity-40 border-border bg-surface'
                      : stageCardStyle(stage.type) + ' cursor-pointer hover:shadow-sm',
                  )}>
                  <Plus className="size-3 shrink-0 text-ink-subtle" />
                  {stage.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Sequence */}
        <div className="flex-1 rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Secuencia del proceso
          </p>

          {display.stages.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-sm text-ink-subtle">
                {editing
                  ? 'Hacé clic en una etapa del panel izquierdo para agregarla.'
                  : 'Este proceso no tiene etapas configuradas.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {display.stages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-3">
                  {i > 0 && <ArrowRight className="size-4 shrink-0 text-ink-subtle" />}
                  <div className={cn(
                    'group relative flex min-w-[140px] flex-col gap-1 rounded-lg border p-3 shadow-sm',
                    stageCardStyle(stage.type),
                  )}>
                    <span className="absolute -left-3 -top-3 flex size-6 items-center justify-center rounded-full border border-border bg-primary-100 text-xs font-bold text-primary-700">
                      {i + 1}
                    </span>
                    <p className={cn('text-sm font-medium text-ink', editing && 'pr-4')}>
                      {stage.name}
                    </p>
                    {editing && (
                      <button type="button" onClick={() => removeStage(stage.id)}
                        className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded text-ink-subtle opacity-0 transition-opacity hover:bg-surface hover:text-danger group-hover:opacity-100">
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fixed stages — always present, never removable */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {display.stages.length > 0 && <ArrowRight className="size-4 shrink-0 text-ink-subtle" />}
            {[FIXED_FINAL, FIXED_REJECTED].map((stage, i) => (
              <div key={stage.name} className="flex items-center gap-3">
                {(display.stages.length > 0 || i > 0) && i > 0 && <ArrowRight className="size-4 shrink-0 text-ink-subtle" />}
                <div className={cn(
                  'relative flex min-w-[140px] flex-col gap-1 rounded-lg border p-3 shadow-sm',
                  stageCardStyle(stage.type),
                )}>
                  <span className="absolute -left-3 -top-3 flex size-6 items-center justify-center rounded-full border border-border bg-primary-100 text-xs font-bold text-primary-700">
                    {display.stages.length + i + 1}
                  </span>
                  <p className="text-sm font-medium text-ink">{stage.name}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-ink-subtle">
            {display.stages.length} etapa{display.stages.length !== 1 ? 's' : ''} en la secuencia · Oferta y Rechazados siempre presentes
          </p>
        </div>
      </div>

      {/* Save bar — edit mode only */}
      {editing && (
        <div className="sticky bottom-0 -mx-6 -mb-6 mt-auto flex items-center justify-end gap-3 border-t border-border bg-surface px-6 py-3">
          <Button variant="outline" onClick={handleDiscard}>Descartar</Button>
          <Button onClick={handleSave} disabled={isSaving || !draft.name.trim() || !draft.clientCompany || !draft.department}>
            <Save className="mr-1.5 size-4" />
            {isSaving ? 'Guardando…' : 'Guardar proceso'}
          </Button>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={confirmDeleteOpen}
      onOpenChange={setConfirmDeleteOpen}
      title="¿Eliminar proceso?"
      description="Esta acción desactivará el proceso de forma permanente. Las vacantes que lo usan no se verán afectadas."
      confirmLabel="Eliminar"
      variant="danger"
      onConfirm={confirmDelete}
    />
    </>
  );
}
