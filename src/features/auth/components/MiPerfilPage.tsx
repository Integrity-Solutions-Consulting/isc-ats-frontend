'use client';

import { useState } from 'react';
import { Save, X, Eye, EyeOff, Pencil } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { cn } from '@/shared/utils';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const SLOT_DURATIONS = [30, 45, 60, 90] as const;

// Unique id for slots added at runtime (client-only, after hydration).
function nextSlotId() { return `slot-${crypto.randomUUID()}`; }

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

const DEFAULT_AVAILABILITY: Availability = {
  Lunes:     { enabled: true,  slots: [{ id: 'slot-lun-am', from: '09:00', to: '12:00' }, { id: 'slot-lun-pm', from: '14:00', to: '17:00' }] },
  Martes:    { enabled: true,  slots: [{ id: 'slot-mar-am', from: '09:00', to: '12:00' }] },
  Miércoles: { enabled: true,  slots: [{ id: 'slot-mie-am', from: '09:00', to: '12:00' }, { id: 'slot-mie-pm', from: '14:00', to: '17:00' }] },
  Jueves:    { enabled: true,  slots: [{ id: 'slot-jue-am', from: '09:00', to: '12:00' }] },
  Viernes:   { enabled: true,  slots: [{ id: 'slot-vie-am', from: '09:00', to: '11:00' }] },
  Sábado:    { enabled: false, slots: [] },
  Domingo:   { enabled: false, slots: [] },
};

// ─── Read-only summary of one day ────────────────────────────────────────────

function DaySummary({ day, avail }: { day: string; avail: DayAvailability }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={cn('text-sm', avail.enabled ? 'font-medium text-ink' : 'text-ink-subtle')}>{day}</span>
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
  day, avail, onToggle, onUpdateSlot, onAddSlot, onRemoveSlot,
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
          <span className={cn(
            'pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform',
            avail.enabled ? 'translate-x-4' : 'translate-x-0',
          )} />
        </button>
      </div>

      {avail.enabled && (
        <div className="mt-2 space-y-2">
          {avail.slots.map((slot, i) => {
            const fromId = `slot-${slot.id}-from`;
            const toId = `slot-${slot.id}-to`;
            return (
            <div key={slot.id} className="flex items-center gap-2">
              <label htmlFor={fromId} className="sr-only">Hora inicio bloque {i + 1} {day}</label>
              <input id={fromId} type="time" value={slot.from} onChange={(e) => onUpdateSlot(i, 'from', e.target.value)}
                className="h-8 rounded-md border border-border bg-bg px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary-300" />
              <span className="text-xs text-ink-subtle" aria-hidden="true">–</span>
              <label htmlFor={toId} className="sr-only">Hora fin bloque {i + 1} {day}</label>
              <input id={toId} type="time" value={slot.to} onChange={(e) => onUpdateSlot(i, 'to', e.target.value)}
                className="h-8 rounded-md border border-border bg-bg px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary-300" />
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
            <button type="button" onClick={onAddSlot} className="text-xs text-primary-600 hover:underline">
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
  // Availability — saved vs draft
  const [savedAvailability, setSavedAvailability] = useState<Availability>(DEFAULT_AVAILABILITY);
  const [draftAvailability, setDraftAvailability] = useState<Availability>(DEFAULT_AVAILABILITY);
  const [editingAvailability, setEditingAvailability] = useState(false);

  // Slot duration — saved vs draft
  const [savedDuration, setSavedDuration] = useState<number>(45);
  const [draftDuration, setDraftDuration] = useState<number>(45);
  const [editingDuration, setEditingDuration] = useState(false);

  // Security
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  // ── Availability handlers ──────────────────────────────────────────────────

  const startEditAvailability = () => {
    setDraftAvailability(savedAvailability);
    setEditingAvailability(true);
  };

  const discardAvailability = () => {
    setDraftAvailability(savedAvailability);
    setEditingAvailability(false);
  };

  const saveAvailability = () => {
    setSavedAvailability(draftAvailability);
    setEditingAvailability(false);
  };

  const toggleDay = (day: string) =>
    setDraftAvailability((a) => ({
      ...a,
      [day]: {
        ...a[day],
        enabled: !a[day].enabled,
        slots: !a[day].enabled && a[day].slots.length === 0 ? [{ id: nextSlotId(), from: '09:00', to: '12:00' }] : a[day].slots,
      },
    }));

  const updateSlot = (day: string, index: number, field: 'from' | 'to', value: string) =>
    setDraftAvailability((a) => ({
      ...a,
      [day]: { ...a[day], slots: a[day].slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)) },
    }));

  const addSlot = (day: string) => {
    if (draftAvailability[day].slots.length >= 2) return;
    setDraftAvailability((a) => ({ ...a, [day]: { ...a[day], slots: [...a[day].slots, { id: nextSlotId(), from: '14:00', to: '17:00' }] } }));
  };

  const removeSlot = (day: string, index: number) =>
    setDraftAvailability((a) => ({ ...a, [day]: { ...a[day], slots: a[day].slots.filter((_, i) => i !== index) } }));

  // ── Slot duration handlers ────────────────────────────────────────────────

  const startEditDuration = () => {
    setDraftDuration(savedDuration);
    setEditingDuration(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">Mi perfil</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Availability card ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Disponibilidad para entrevistas</p>
            {!editingAvailability && (
              <Button variant="outline" size="sm" onClick={startEditAvailability}>
                <Pencil className="mr-1.5 size-3.5" />
                Editar
              </Button>
            )}
          </div>

          {editingAvailability ? (
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
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={discardAvailability}>
                  Descartar
                </Button>
                <Button size="sm" onClick={saveAvailability}>
                  <Save className="mr-1.5 size-3.5" />
                  Guardar disponibilidad
                </Button>
              </div>
            </>
          ) : (
            <div className="divide-y divide-border">
              {DAYS.map((day) => (
                <DaySummary key={day} day={day} avail={savedAvailability[day]} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Slot duration card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Duración de cada slot</p>
              {!editingDuration && (
                <Button variant="outline" size="sm" onClick={startEditDuration}>
                  <Pencil className="mr-1.5 size-3.5" />
                  Editar
                </Button>
              )}
            </div>

            {editingDuration ? (
              <>
                <div className="flex gap-2">
                  {SLOT_DURATIONS.map((d) => (
                    <button key={d} type="button" onClick={() => setDraftDuration(d)}
                      className={cn(
                        'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                        draftDuration === d
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-border bg-bg text-ink hover:bg-primary-50',
                      )}>
                      {d} min
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setDraftDuration(savedDuration); setEditingDuration(false); }}>
                    Descartar
                  </Button>
                  <Button size="sm" onClick={() => { setSavedDuration(draftDuration); setEditingDuration(false); }}>
                    <Save className="mr-1.5 size-3.5" />
                    Guardar
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-muted">{savedDuration} minutos por slot</p>
            )}
          </div>

          {/* Security card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-ink">Seguridad</p>

            {!showPasswordForm ? (
              <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                Cambiar contraseña
              </Button>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Contraseña actual',          key: 'current', show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
                  { label: 'Nueva contraseña',           key: 'next',    show: showNew,     toggle: () => setShowNew((v) => !v) },
                  { label: 'Confirmar nueva contraseña', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
                ].map(({ label, key, show, toggle }) => {
                  const fieldId = `miperfil-pw-${key}`;
                  return (
                  <div key={key}>
                    <label htmlFor={fieldId} className="mb-1 block text-xs text-ink-muted">{label}</label>
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
                  <Button variant="outline" size="sm" onClick={() => { setShowPasswordForm(false); setPwForm({ current: '', next: '', confirm: '' }); }}>
                    Cancelar
                  </Button>
                  <Button size="sm">Guardar contraseña</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
