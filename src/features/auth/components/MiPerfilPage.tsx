'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Pencil, Save, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/design-system/ui/button';
import { cn } from '@/shared/utils';
import {
  createAvailability,
  deleteAvailability,
} from '@/features/interviews/api/availabilityApi';
import {
  availabilityKeys,
  useMyAvailability,
} from '@/features/interviews/hooks/useAvailability';
import type {
  AvailabilityCreatePayload,
  AvailabilityWindow,
} from '@/features/interviews/types';

// DAYS index === backend day_of_week (0 = Monday ... 6 = Sunday).
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const SLOT_DURATIONS = [30, 45, 60, 90] as const;
const BUFFER_OPTIONS = [0, 5, 10, 15, 30] as const;

// Unique id for slots added at runtime (client-only, after hydration).
function nextSlotId() {
  return `slot-${crypto.randomUUID()}`;
}

function hhmm(t: string): string {
  return t.slice(0, 5);
}

interface TimeSlot {
  id: string;
  from: string;
  to: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

type Availability = Record<string, DayAvailability>;

function emptyAvailability(): Availability {
  return Object.fromEntries(
    DAYS.map((day) => [day, { enabled: false, slots: [] }]),
  ) as Availability;
}

// Backend windows → the per-day editor model.
function windowsToAvailability(windows: AvailabilityWindow[]): Availability {
  const result = emptyAvailability();
  DAYS.forEach((day, dayIndex) => {
    const dayWindows = windows
      .filter((w) => w.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    result[day] = {
      enabled: dayWindows.length > 0,
      slots: dayWindows.map((w) => ({
        id: `db-${w.id}`,
        from: hhmm(w.startTime),
        to: hhmm(w.endTime),
      })),
    };
  });
  return result;
}

// The per-day editor model + global duration/buffer → the desired set of windows.
function buildDesired(
  avail: Availability,
  duration: number,
  buffer: number,
): AvailabilityCreatePayload[] {
  const out: AvailabilityCreatePayload[] = [];
  DAYS.forEach((day, dayIndex) => {
    const d = avail[day];
    if (!d?.enabled) return;
    d.slots.forEach((s) => {
      if (s.from < s.to) {
        out.push({
          dayOfWeek: dayIndex,
          startTime: s.from,
          endTime: s.to,
          slotDurationMin: duration,
          bufferMin: buffer,
        });
      }
    });
  });
  return out;
}

// A window is identified by day + times + duration + buffer, so a global
// duration/buffer change recreates the affected rows while untouched windows
// are left alone.
const existingKey = (w: AvailabilityWindow) =>
  `${w.dayOfWeek}|${hhmm(w.startTime)}|${hhmm(w.endTime)}|${w.slotDurationMin}|${w.bufferMin}`;
const desiredKey = (d: AvailabilityCreatePayload) =>
  `${d.dayOfWeek}|${d.startTime}|${d.endTime}|${d.slotDurationMin}|${d.bufferMin}`;

// ─── Read-only summary of one day ────────────────────────────────────────────

function DaySummary({ day, avail }: { day: string; avail: DayAvailability }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={cn('text-sm', avail.enabled ? 'font-medium text-ink' : 'text-ink-subtle')}>
        {day}
      </span>
      {avail.enabled ? (
        <span className="text-xs text-ink-muted">
          {avail.slots.map((s) => `${s.from}–${s.to}`).join('  ·  ') || '—'}
        </span>
      ) : (
        <span className="text-xs text-ink-subtle">No disponible</span>
      )}
    </div>
  );
}

// ─── Editable day row ─────────────────────────────────────────────────────────

function DayEditor({
  day,
  avail,
  onToggle,
  onUpdateSlot,
  onAddSlot,
  onRemoveSlot,
}: {
  day: string;
  avail: DayAvailability;
  onToggle: () => void;
  onUpdateSlot: (i: number, f: 'from' | 'to', v: string) => void;
  onAddSlot: () => void;
  onRemoveSlot: (i: number) => void;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{day}</span>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300',
            avail.enabled ? 'bg-primary-600' : 'bg-surface-2',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform',
              avail.enabled ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {avail.enabled && (
        <div className="mt-2 space-y-2">
          {avail.slots.map((slot, i) => {
            const fromId = `slot-${slot.id}-from`;
            const toId = `slot-${slot.id}-to`;
            const invalid = slot.from >= slot.to;
            return (
              <div key={slot.id} className="flex items-center gap-2">
                <label htmlFor={fromId} className="sr-only">
                  Hora inicio bloque {i + 1} {day}
                </label>
                <input
                  id={fromId}
                  type="time"
                  value={slot.from}
                  onChange={(e) => onUpdateSlot(i, 'from', e.target.value)}
                  className={cn(
                    'h-8 rounded-md border bg-bg px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary-300',
                    invalid ? 'border-danger' : 'border-border',
                  )}
                />
                <span className="text-xs text-ink-subtle" aria-hidden="true">
                  –
                </span>
                <label htmlFor={toId} className="sr-only">
                  Hora fin bloque {i + 1} {day}
                </label>
                <input
                  id={toId}
                  type="time"
                  value={slot.to}
                  onChange={(e) => onUpdateSlot(i, 'to', e.target.value)}
                  className={cn(
                    'h-8 rounded-md border bg-bg px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary-300',
                    invalid ? 'border-danger' : 'border-border',
                  )}
                />
                <button
                  type="button"
                  aria-label={`Eliminar bloque ${i + 1}`}
                  onClick={() => onRemoveSlot(i)}
                  className="ml-auto text-ink-subtle hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
          {avail.slots.length < 2 && (
            <button
              type="button"
              onClick={onAddSlot}
              className="text-xs text-primary-600 hover:underline"
            >
              + Agregar bloque
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MiPerfilPage() {
  const queryClient = useQueryClient();
  const { data: windows = [], isLoading } = useMyAvailability();

  // Saved state is derived straight from the backend (no local mirror to drift).
  const savedAvailability = useMemo(() => windowsToAvailability(windows), [windows]);
  const savedDuration = windows[0]?.slotDurationMin ?? 30;
  const savedBuffer = windows[0]?.bufferMin ?? 10;

  // Draft state only matters while editing; it is seeded on "Editar".
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [draftAvailability, setDraftAvailability] = useState<Availability>(emptyAvailability);
  const [draftDuration, setDraftDuration] = useState<number>(30);
  const [draftBuffer, setDraftBuffer] = useState<number>(10);

  // Security
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const desired = buildDesired(draftAvailability, draftDuration, draftBuffer);
      const existingKeys = new Set(windows.map(existingKey));
      const desiredKeys = new Set(desired.map(desiredKey));
      const toDelete = windows.filter((w) => !desiredKeys.has(existingKey(w)));
      const toCreate = desired.filter((d) => !existingKeys.has(desiredKey(d)));
      for (const w of toDelete) await deleteAvailability(w.id);
      for (const d of toCreate) await createAvailability(d);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.mine });
      setEditingAvailability(false);
    },
  });

  // ── Availability handlers ──────────────────────────────────────────────────

  const startEditAvailability = () => {
    setDraftAvailability(savedAvailability);
    setDraftDuration(savedDuration);
    setDraftBuffer(savedBuffer);
    setEditingAvailability(true);
  };

  const discardAvailability = () => {
    setEditingAvailability(false);
    saveMutation.reset();
  };

  const toggleDay = (day: string) =>
    setDraftAvailability((a) => ({
      ...a,
      [day]: {
        ...a[day],
        enabled: !a[day].enabled,
        slots:
          !a[day].enabled && a[day].slots.length === 0
            ? [{ id: nextSlotId(), from: '09:00', to: '12:00' }]
            : a[day].slots,
      },
    }));

  const updateSlot = (day: string, index: number, field: 'from' | 'to', value: string) =>
    setDraftAvailability((a) => ({
      ...a,
      [day]: {
        ...a[day],
        slots: a[day].slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
      },
    }));

  const addSlot = (day: string) => {
    if (draftAvailability[day].slots.length >= 2) return;
    setDraftAvailability((a) => ({
      ...a,
      [day]: { ...a[day], slots: [...a[day].slots, { id: nextSlotId(), from: '14:00', to: '17:00' }] },
    }));
  };

  const removeSlot = (day: string, index: number) =>
    setDraftAvailability((a) => ({
      ...a,
      [day]: { ...a[day], slots: a[day].slots.filter((_, i) => i !== index) },
    }));

  const hasInvalidBlock = DAYS.some((day) => {
    const d = draftAvailability[day];
    return d?.enabled && d.slots.some((s) => s.from >= s.to);
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">Mi perfil</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Availability card ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Disponibilidad para entrevistas</p>
            {!editingAvailability && !isLoading && (
              <Button variant="outline" size="sm" onClick={startEditAvailability}>
                <Pencil className="mr-1.5 size-3.5" />
                Editar
              </Button>
            )}
          </div>

          {isLoading ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              <Loader2 className="mr-2 inline size-4 animate-spin" />
              Cargando…
            </p>
          ) : editingAvailability ? (
            <>
              <div className="space-y-3">
                {DAYS.map((day) => (
                  <DayEditor
                    key={day}
                    day={day}
                    avail={draftAvailability[day]}
                    onToggle={() => toggleDay(day)}
                    onUpdateSlot={(i, f, v) => updateSlot(day, i, f, v)}
                    onAddSlot={() => addSlot(day)}
                    onRemoveSlot={(i) => removeSlot(day, i)}
                  />
                ))}
              </div>

              {/* Global duration + buffer */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-ink">
                  Duración de cada slot
                  <select
                    value={draftDuration}
                    onChange={(e) => setDraftDuration(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-border bg-bg px-2 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    {SLOT_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-ink">
                  Buffer entre slots
                  <select
                    value={draftBuffer}
                    onChange={(e) => setDraftBuffer(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-border bg-bg px-2 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    {BUFFER_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b} min
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {hasInvalidBlock && (
                <p className="mt-2 text-xs text-danger">
                  Revisá los bloques: la hora de fin debe ser posterior a la de inicio.
                </p>
              )}
              {saveMutation.isError && (
                <p className="mt-2 text-xs text-danger">No se pudo guardar. Intentá de nuevo.</p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardAvailability}
                  disabled={saveMutation.isPending}
                >
                  Descartar
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={hasInvalidBlock || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 size-3.5" />
                      Guardar disponibilidad
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="divide-y divide-border">
                {DAYS.map((day) => (
                  <DaySummary key={day} day={day} avail={savedAvailability[day]} />
                ))}
              </div>
              {windows.length > 0 && (
                <p className="mt-3 text-xs text-ink-subtle">
                  Slots de {savedDuration} min · buffer {savedBuffer} min entre entrevistas.
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Security card ─────────────────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-ink">Seguridad</p>

          {!showPasswordForm ? (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              Cambiar contraseña
            </Button>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Contraseña actual', key: 'current', show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
                { label: 'Nueva contraseña', key: 'next', show: showNew, toggle: () => setShowNew((v) => !v) },
                { label: 'Confirmar nueva contraseña', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
              ].map(({ label, key, show, toggle }) => {
                const fieldId = `miperfil-pw-${key}`;
                return (
                  <div key={key}>
                    <label htmlFor={fieldId} className="mb-1 block text-xs text-ink-muted">
                      {label}
                    </label>
                    <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-bg px-3">
                      <input
                        id={fieldId}
                        type={show ? 'text' : 'password'}
                        value={pwForm[key as keyof typeof pwForm]}
                        onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="flex-1 bg-transparent text-sm text-ink outline-none"
                      />
                      <button
                        type="button"
                        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={toggle}
                        className="text-ink-subtle hover:text-ink"
                      >
                        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPwForm({ current: '', next: '', confirm: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button size="sm">Guardar contraseña</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
