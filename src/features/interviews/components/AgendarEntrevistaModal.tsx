'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDays, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  X,
} from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { cn } from '@/shared/utils';
import {
  useAvailableSlots,
  useCreateInterview,
  useInterviewers,
  useOfferSlots,
} from '../hooks/useInterviews';
import type { Slot } from '../types';

interface Props {
  applicationId: number;
  /** org.process_stages id; undefined when the candidate is rejected (no stage). */
  processStageId: number | undefined;
  candidateName: string;
  position: string;
  onClose: () => void;
}

type Tab = 'candidate-chooses' | 'rh-selects';

interface OfferedEntry {
  slot: Slot;
  dayLabel: string;
}

// Ecuador is a fixed UTC-5 (no DST). Slots arrive as UTC ISO strings; we render
// their Ecuador wall-clock time by shifting and reading the UTC components.
const EC_OFFSET_MS = 5 * 60 * 60 * 1000;

function ecTime(iso: string): string {
  return new Date(new Date(iso).getTime() - EC_OFFSET_MS).toISOString().slice(11, 16);
}

function slotKey(s: Slot): string {
  return `${s.start}|${s.end}`;
}

export function AgendarEntrevistaModal({
  applicationId,
  processStageId,
  candidateName,
  position,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('candidate-chooses');
  const [interviewerId, setInterviewerId] = useState<number | null>(null);
  const [date, setDate] = useState<Date>(startOfToday());
  const [selected, setSelected] = useState<Slot | null>(null); // Mode A — single
  const [offered, setOffered] = useState<OfferedEntry[]>([]); // Mode B — accumulated
  const [extraEmail, setExtraEmail] = useState('');
  const [subject, setSubject] = useState(`Entrevista para ${position}`);

  const { data: interviewers = [], isLoading: loadingInterviewers } = useInterviewers();
  // Effective interviewer = the explicit choice, else default to the first available.
  const effectiveInterviewerId = interviewerId ?? interviewers[0]?.id ?? null;

  const dateApi = format(date, 'yyyy-MM-dd');
  const dayLabel = format(date, 'EEE d MMM', { locale: es });
  const { data: slots = [], isLoading: loadingSlots } = useAvailableSlots(
    effectiveInterviewerId,
    dateApi,
  );

  // The Mode A pick only applies to the current day + interviewer, so clear it
  // in the change handlers (never in an effect — that triggers cascading renders).
  function changeDate(delta: number) {
    setDate((d) => addDays(d, delta));
    setSelected(null);
  }

  function changeInterviewer(id: number | null) {
    setInterviewerId(id);
    setSelected(null);
  }

  const createMutation = useCreateInterview();
  const offerMutation = useOfferSlots();
  const submitting = createMutation.isPending || offerMutation.isPending;
  const isSuccess = createMutation.isSuccess || offerMutation.isSuccess;
  const error = createMutation.error?.message ?? offerMutation.error?.message ?? null;

  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [isSuccess, onClose]);

  const offeredKeys = useMemo(
    () => new Set(offered.map((o) => slotKey(o.slot))),
    [offered],
  );

  const noStage = processStageId === undefined;
  const canPrev = date > startOfToday();

  function toggleOffered(slot: Slot) {
    const key = slotKey(slot);
    setOffered((prev) =>
      prev.some((o) => slotKey(o.slot) === key)
        ? prev.filter((o) => slotKey(o.slot) !== key)
        : [...prev, { slot, dayLabel }],
    );
  }

  function handleConfirmModeA() {
    if (!effectiveInterviewerId || !selected || processStageId === undefined) return;
    createMutation.mutate({
      applicationId,
      processStageId,
      interviewerId: effectiveInterviewerId,
      start: selected.start,
      end: selected.end,
      extraEmail: extraEmail || undefined,
    });
  }

  function handleSendModeB() {
    if (!effectiveInterviewerId || offered.length === 0 || processStageId === undefined) return;
    offerMutation.mutate({
      applicationId,
      processStageId,
      interviewerId: effectiveInterviewerId,
      offeredSlots: offered.map((o) => o.slot),
      extraEmail: extraEmail || undefined,
      subject: subject || undefined,
    });
  }

  const successMessage =
    tab === 'candidate-chooses'
      ? 'El candidato recibirá una notificación y un correo para elegir su horario.'
      : 'La entrevista quedó agendada. Se creará la reunión de Teams y se enviará la invitación.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-ink">Agendar entrevista</h2>
            <p className="text-xs text-ink-muted">
              {candidateName} · {position}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(
            [
              { key: 'candidate-chooses', label: 'Candidato elige horario' },
              { key: 'rh-selects', label: 'RH selecciona' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 px-4 py-3 text-sm transition-colors',
                tab === key
                  ? 'border-b-2 border-primary-600 font-semibold text-primary-700'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <CheckCircle2 size={56} className="text-success" />
              <div>
                <p className="text-lg font-bold text-ink">
                  {tab === 'candidate-chooses' ? 'Invitación enviada' : 'Entrevista agendada'}
                </p>
                <p className="mt-1 max-w-sm text-sm text-ink-muted">{successMessage}</p>
              </div>
            </div>
          ) : noStage ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-ink">
              No se puede agendar una entrevista para un candidato rechazado. Movelo a una
              etapa del proceso primero.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Interviewer + date controls */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="interviewer-select"
                    className="mb-1 block text-xs font-medium text-ink"
                  >
                    Entrevistador
                  </label>
                  <select
                    id="interviewer-select"
                    value={effectiveInterviewerId ?? ''}
                    onChange={(e) => changeInterviewer(Number(e.target.value) || null)}
                    disabled={loadingInterviewers || interviewers.length === 0}
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50"
                  >
                    {interviewers.length === 0 && (
                      <option value="">
                        {loadingInterviewers ? 'Cargando…' : 'Sin entrevistadores con disponibilidad'}
                      </option>
                    )}
                    {interviewers.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-medium text-ink">Día</span>
                  <div className="flex items-center justify-between rounded-md border border-border bg-bg px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => changeDate(-1)}
                      disabled={!canPrev}
                      className="rounded p-1 text-ink-muted hover:bg-primary-50 disabled:opacity-30"
                      aria-label="Día anterior"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-sm font-medium capitalize text-ink">
                      {format(date, "EEE d 'de' MMM", { locale: es })}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeDate(1)}
                      className="rounded p-1 text-ink-muted hover:bg-primary-50"
                      aria-label="Día siguiente"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slots grid */}
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {tab === 'rh-selects' ? 'Elegí un horario' : 'Sumá los horarios a ofrecer'}
                </p>
                {loadingSlots ? (
                  <p className="py-6 text-center text-sm text-ink-muted">
                    <Loader2 className="mr-2 inline size-4 animate-spin" />
                    Cargando horarios…
                  </p>
                ) : slots.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-muted">
                    Sin horarios disponibles para este día.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => {
                      const key = slotKey(s);
                      const active =
                        tab === 'rh-selects'
                          ? selected !== null && slotKey(selected) === key
                          : offeredKeys.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            tab === 'rh-selects'
                              ? setSelected(active ? null : s)
                              : toggleOffered(s)
                          }
                          className={cn(
                            'rounded-md border px-2 py-1.5 text-xs transition-colors',
                            active
                              ? 'border-primary-600 bg-primary-600 font-medium text-white'
                              : 'border-border bg-bg text-ink-muted hover:bg-primary-50',
                          )}
                        >
                          {ecTime(s.start)}–{ecTime(s.end)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mode B — accumulated selection */}
              {tab === 'candidate-chooses' && offered.length > 0 && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                    Seleccionados ({offered.length})
                  </p>
                  <ul className="space-y-1.5">
                    {offered.map((o) => (
                      <li
                        key={slotKey(o.slot)}
                        className="flex items-center justify-between text-sm text-ink"
                      >
                        <span className="capitalize">
                          {o.dayLabel} · {ecTime(o.slot.start)}–{ecTime(o.slot.end)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleOffered(o.slot)}
                          className="rounded p-0.5 text-ink-muted hover:text-danger"
                          aria-label="Quitar horario"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mode A — summary */}
              {tab === 'rh-selects' && selected && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm">
                  <p className="font-medium text-ink">Resumen</p>
                  <p className="mt-1 capitalize text-ink-muted">
                    {candidateName} · {format(date, "EEE d 'de' MMM", { locale: es })} ·{' '}
                    {ecTime(selected.start)}–{ecTime(selected.end)}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    La reunión de Teams se creará al confirmar.
                  </p>
                </div>
              )}

              {/* Extra fields */}
              <div className="grid gap-3 sm:grid-cols-2">
                {tab === 'candidate-chooses' && (
                  <div>
                    <label htmlFor="subject" className="mb-1 block text-xs font-medium text-ink">
                      Asunto del correo
                    </label>
                    <input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="extra-email" className="mb-1 block text-xs font-medium text-ink">
                    Participante adicional (opcional)
                  </label>
                  <input
                    id="extra-email"
                    type="email"
                    value={extraEmail}
                    onChange={(e) => setExtraEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="flex items-center gap-3 border-t border-border bg-surface px-5 py-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {tab === 'candidate-chooses' ? (
              <Button
                className="ml-auto"
                onClick={handleSendModeB}
                disabled={noStage || submitting || !effectiveInterviewerId || offered.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 size-4" />
                    Enviar invitación{offered.length > 0 ? ` (${offered.length})` : ''}
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="ml-auto"
                onClick={handleConfirmModeA}
                disabled={noStage || submitting || !effectiveInterviewerId || !selected}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Agendando…
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 size-4" />
                    Confirmar entrevista
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
