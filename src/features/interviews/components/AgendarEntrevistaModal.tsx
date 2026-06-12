'use client';

import { useState } from 'react';
import { X, Send, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import { cn } from '@/shared/utils';

interface Props {
  candidateName: string;
  candidateInitials: string;
  avatarColor: string;
  position: string;
  onClose: () => void;
}

type Tab = 'candidate-chooses' | 'rh-selects';

const AVAILABILITY = [
  { day: 'Lun 2 jun', slots: ['09:00–09:30', '09:30–10:00', '14:00–14:30'] },
  { day: 'Mar 3 jun', slots: ['10:00–10:30', '10:30–11:00'] },
  { day: 'Mié 4 jun', slots: ['09:00–09:30', '14:00–14:30', '15:00–15:30'] },
  { day: 'Jue 5 jun', slots: ['09:30–10:00'] },
  { day: 'Vie 6 jun', slots: ['10:00–10:30', '11:00–11:30'] },
];

// Simulate taken slots
const TAKEN_SLOTS = new Set(['Lun 2 jun|09:30–10:00', 'Mié 4 jun|14:00–14:30']);

export function AgendarEntrevistaModal({ candidateName, candidateInitials: _candidateInitials, avatarColor: _avatarColor, position, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('candidate-chooses');
  const [subject, setSubject] = useState(`Entrevista para ${position}`);
  const [extraParticipant, setExtraParticipant] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Scrim */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-ink">Agendar entrevista</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {([
            { key: 'candidate-chooses', label: 'Candidato elige horario' },
            { key: 'rh-selects', label: 'RH selecciona' },
          ] as const).map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={cn('flex-1 px-4 py-3 text-sm transition-colors', tab === key ? 'border-b-2 border-primary-600 font-semibold text-primary-700' : 'text-ink-muted hover:text-ink')}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {tab === 'candidate-chooses' && sent ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <CheckCircle2 size={56} className="text-success" />
              <div>
                <p className="text-lg font-bold text-ink">Invitación enviada</p>
                <p className="mt-1 text-sm text-ink-muted max-w-sm">
                  El candidato recibirá un correo con los horarios disponibles para elegir.
                </p>
                <p className="mt-2 text-xs text-ink-subtle max-w-sm">
                  Los slots ofrecidos quedarán registrados y se confirmará automáticamente cuando el candidato elija.
                </p>
              </div>
            </div>
          ) : tab === 'candidate-chooses' ? (
            <div className="space-y-4">
              {/* Availability grid */}
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Disponibilidad del equipo RH</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABILITY.map((day) => (
                    <div key={day.day} className="rounded-md border border-border bg-surface p-2 text-center">
                      <p className="mb-1.5 text-xs font-semibold text-ink">{day.day}</p>
                      {day.slots.map((slot) => (
                        <p key={slot} className="text-xs text-ink-muted">{slot}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Email preview */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-2">
                  <p className="text-xs font-semibold text-ink-muted">Vista previa del correo</p>
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">Se enviará automáticamente</span>
                </div>
                <div className="bg-surface p-4">
                  <div className="mb-3 space-y-1 text-xs text-ink-muted">
                    <p><span className="font-medium text-ink">Para:</span> {candidateName.toLowerCase().replace(' ', '.')}@email.com</p>
                    <p><span className="font-medium text-ink">Asunto:</span> {subject}</p>
                  </div>
                  <div className="text-sm leading-relaxed text-ink-muted">
                    <p>Estimado/a <span className="rounded bg-warning/20 px-1 text-xs font-medium text-warning-700">{`{{nombre}}`}</span>,</p>
                    <p className="mt-2">Le invitamos a seleccionar un horario para su entrevista para el cargo de <span className="rounded bg-warning/20 px-1 text-xs font-medium text-warning-700">{`{{cargo}}`}</span>.</p>
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
                        Elegir mi horario
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-ink-subtle">La reunión de Teams se creará automáticamente cuando confirme su horario.</p>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Asunto del correo</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Participante adicional (opcional)</label>
                  <input type="email" value={extraParticipant} onChange={(e) => setExtraParticipant(e.target.value)}
                    placeholder="correo@empresa.com"
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-ink-subtle" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Slot grid */}
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Seleccionar horario</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABILITY.map((day) => (
                    <div key={day.day} className="rounded-md border border-border bg-surface p-2">
                      <p className="mb-2 text-center text-xs font-semibold text-ink">{day.day}</p>
                      {day.slots.map((slot) => {
                        const key = `${day.day}|${slot}`;
                        const taken = TAKEN_SLOTS.has(key);
                        const isSelected = selectedSlot === key;
                        return (
                          <button key={slot} type="button" disabled={taken}
                            onClick={() => setSelectedSlot(isSelected ? null : key)}
                            className={cn(
                              'mb-1 w-full rounded px-1 py-1 text-center text-xs transition-colors',
                              taken ? 'text-ink-subtle line-through opacity-40 cursor-not-allowed' :
                              isSelected ? 'bg-primary-600 font-medium text-white' :
                              'bg-bg hover:bg-primary-100 text-ink-muted border border-border',
                            )}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {selectedSlot && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm">
                  <p className="font-medium text-ink">Resumen de entrevista</p>
                  <p className="mt-1 text-ink-muted">
                    {candidateName} · {position} · {selectedSlot.split('|').join(' — ')}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">La reunión de Teams se creará al confirmar.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Asunto</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink">Participante adicional</label>
                  <input type="email" value={extraParticipant} onChange={(e) => setExtraParticipant(e.target.value)}
                    placeholder="correo@empresa.com"
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300 placeholder:text-ink-subtle" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-border bg-surface px-5 py-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="ml-auto"
            onClick={handleSend}
            disabled={sent || (tab === 'rh-selects' && !selectedSlot)}
          >
            {sent ? (
              <><Check className="mr-1.5 size-4" />Enviado</>
            ) : tab === 'candidate-chooses' ? (
              <><Send className="mr-1.5 size-4" />Enviar invitación</>
            ) : (
              <><Check className="mr-1.5 size-4" />Confirmar entrevista</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
