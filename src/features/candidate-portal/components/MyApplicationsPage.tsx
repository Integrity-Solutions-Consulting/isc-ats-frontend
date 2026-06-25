'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clipboard, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/design-system/ui/button';
import { cn } from '@/shared/utils';
import type { CandidateApplication, OfferSlot } from '../types';
import { STAGE_LABELS } from '../constants/stageLabels';
import { confirmInterviewOffer } from '../api/candidateApi';
import { ROUTES } from '@/shared/constants/routes';

interface MyApplicationsPageProps {
  applications: CandidateApplication[];
}


type Tab = 'all' | 'active' | 'finished';

const ACTIVE_STATUSES: CandidateApplication['status'][] = [
  'reviewing',
  'interview_initial',
  'interview_technical',
  'offer',
];
const FINISHED_STATUSES: CandidateApplication['status'][] = ['hired', 'rejected', 'cancelled'];

// Offered slots arrive as UTC ISO strings. Ecuador is a fixed UTC-5 (no DST);
// we render the Ecuador wall-clock time by shifting and reading UTC components.
const EC_OFFSET_MS = 5 * 60 * 60 * 1000;

function ecTime(iso: string): string {
  return new Date(new Date(iso).getTime() - EC_OFFSET_MS).toISOString().slice(11, 16);
}

function ecDayKey(iso: string): string {
  return new Date(new Date(iso).getTime() - EC_OFFSET_MS).toISOString().slice(0, 10);
}

function ecDayLabel(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() - EC_OFFSET_MS);
  // Rebuild a local date from the Ecuador calendar fields so the day label is
  // correct regardless of the browser timezone (date-only, no time shift).
  const local = new Date(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return format(local, "EEE d 'de' MMM", { locale: es });
}

function slotKey(slot: OfferSlot): string {
  return `${slot.start}|${slot.end}`;
}

interface DayGroup {
  key: string;
  label: string;
  slots: OfferSlot[];
}

function groupSlotsByDay(slots: OfferSlot[]): DayGroup[] {
  const byDay = new Map<string, DayGroup>();
  for (const slot of [...slots].sort((a, b) => a.start.localeCompare(b.start))) {
    const key = ecDayKey(slot.start);
    let group = byDay.get(key);
    if (!group) {
      group = { key, label: ecDayLabel(slot.start), slots: [] };
      byDay.set(key, group);
    }
    group.slots.push(slot);
  }
  return [...byDay.values()];
}

function ApplicationCard({ app }: { app: CandidateApplication }) {
  const [selectedSlot, setSelectedSlot] = useState<OfferSlot | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState<{ day: string; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offer = app.offer;
  const dayGroups = offer ? groupSlotsByDay(offer.slots) : [];

  const showSlotPicker =
    app.slotStatus === 'pending_selection' &&
    offer !== undefined &&
    offer.slots.length > 0 &&
    !confirmedSlot;

  const showInterviewBanner =
    confirmedSlot !== null ||
    app.slotStatus === 'confirmed' ||
    app.interview !== undefined;

  const handleConfirm = async () => {
    if (!offer || !selectedSlot) return;
    setConfirming(true);
    setError(null);
    try {
      await confirmInterviewOffer(offer.interviewId, selectedSlot);
      setConfirmedSlot({
        day: ecDayLabel(selectedSlot.start),
        time: `${ecTime(selectedSlot.start)}–${ecTime(selectedSlot.end)}`,
      });
      setSelectedSlot(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar el horario');
    } finally {
      setConfirming(false);
    }
  };

  // Derive current stage index from the vacancy's own process stages.
  // When rejected, we detach the stepper (currentStageIndex = -1) and append a
  // standalone "No seleccionado" trailing node with no connecting line.
  const stages = app.stages ?? [];
  const isRejected = app.status === 'rejected';
  const currentStageIndex = (!isRejected && app.currentStageId != null)
    ? stages.findIndex((s) => s.id === app.currentStageId)
    : -1;

  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
      <p className="font-semibold text-ink text-sm leading-tight">{app.vacancyTitle}</p>

      {/* Pipeline — real stages from vacancy's process */}
      {stages.length > 0 && (
        <div className="flex items-center flex-wrap gap-y-2">
          {stages.map((stage, idx) => {
            const isPast = !isRejected && idx < currentStageIndex;
            const isCurrent = !isRejected && idx === currentStageIndex;
            const isLast = idx === stages.length - 1;

            return (
              <div key={stage.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      isCurrent
                        ? 'bg-primary-600 text-white'
                        : isPast
                          ? 'bg-primary-200 text-primary-700'
                          : 'bg-surface-2 text-ink-subtle',
                    )}
                  >
                    {stage.order}
                  </div>
                  <span className="text-[9px] text-ink-subtle text-center leading-tight w-12 hidden sm:block">
                    {stage.name}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-0.5',
                      !isRejected && idx < currentStageIndex ? 'bg-primary-200' : 'bg-surface-2',
                    )}
                  />
                )}
              </div>
            );
          })}

          {/* Detached rejected node — no connecting line to the prior stages */}
          {isRejected && (
            <div className="flex flex-col items-center gap-1 ml-3">
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-danger/20 text-danger">
                ✕
              </div>
              <span className="text-[9px] text-danger text-center leading-tight w-16 hidden sm:block">
                {STAGE_LABELS.rejected}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-ink-subtle">
        Postulado el {app.appliedAt} · Última actualización: {app.lastUpdate}
      </p>

      {/* Slot picker */}
      {showSlotPicker && (
        <div className="bg-primary-50 border border-primary-700/20 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary-800 shrink-0" />
              <p className="text-[14px] font-semibold text-primary-800">
                Elige tu horario de entrevista
              </p>
            </div>
            <p className="text-[12px] text-ink-muted pl-5">
              El equipo de Talento Humano te invita a seleccionar un slot
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {dayGroups.map((group) => (
              <div key={group.key} className="flex flex-col gap-1.5">
                <p className="text-[12px] font-semibold text-primary-800">{group.label}</p>
                {group.slots.map((slot) => {
                  const isSelected =
                    selectedSlot !== null && slotKey(selectedSlot) === slotKey(slot);
                  return (
                    <button
                      key={slotKey(slot)}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'text-[12px] rounded-lg px-2 py-1.5 transition-colors',
                        isSelected
                          ? 'bg-primary-700 text-white'
                          : 'bg-white border border-primary-200 text-ink-muted hover:border-primary-700 hover:text-primary-700',
                      )}
                    >
                      {ecTime(slot.start)}–{ecTime(slot.end)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={!selectedSlot || confirming}
              onClick={handleConfirm}
              className="bg-primary-700 text-white text-[13px] font-semibold rounded-lg px-5 py-2 hover:bg-primary-600 disabled:opacity-40 transition-colors"
            >
              {confirming ? 'Confirmando...' : 'Confirmar horario'}
            </button>
          </div>
        </div>
      )}

      {/* Interview banner — scheduled or just confirmed */}
      {showInterviewBanner && (
        <div className="bg-warning/10 border border-warning/30 rounded-md px-4 py-3 flex items-start gap-3">
          <Calendar size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            {confirmedSlot ? (
              <>
                <p className="font-medium text-ink">
                  {confirmedSlot.day} — {confirmedSlot.time}
                </p>
                <p className="text-ink-muted text-xs">Horario confirmado</p>
              </>
            ) : app.interview ? (
              <>
                <p className="font-medium text-ink">
                  {app.interview.date} — {app.interview.time}
                </p>
                <p className="text-ink-muted text-xs">{app.interview.platform}</p>
                <button type="button" className="text-primary-600 text-xs mt-1 hover:underline">
                  Agregar al calendario
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {app.status === 'hired' && (
        <div className="bg-success/10 border border-success/30 rounded-md px-4 py-3 text-sm text-ink">
          Felicitaciones. Fuiste seleccionado para esta posición.
        </div>
      )}
    </div>
  );
}

export function MyApplicationsPage({ applications }: MyApplicationsPageProps) {
  const [tab, setTab] = useState<Tab>('all');

  const total = applications.length;
  const active = applications.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
  const hired = applications.filter((a) => a.status === 'hired').length;
  const finished = applications.filter((a) => FINISHED_STATUSES.includes(a.status)).length;
  const pending = applications.filter((a) => a.slotStatus === 'pending_selection').length;

  const filtered = applications.filter((a) => {
    if (tab === 'active') return ACTIVE_STATUSES.includes(a.status);
    if (tab === 'finished') return FINISHED_STATUSES.includes(a.status);
    return true;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'active', label: 'En proceso' },
    { key: 'finished', label: 'Finalizadas' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[26px] font-bold text-ink">Mis postulaciones</h1>
        <p className="text-ink-muted mt-1">Seguimiento de tus postulaciones activas e historial.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1">
          <p className="text-2xl font-bold text-ink">{total}</p>
          <p className="text-xs text-ink-muted">Total postulaciones</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1">
          <p className="text-2xl font-bold text-primary-600">{active}</p>
          <p className="text-xs text-ink-muted">En proceso</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1">
          <p className="text-2xl font-bold text-success">{hired}</p>
          <p className="text-xs text-ink-muted">Contratado</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1">
          <p className="text-2xl font-bold text-ink-muted">{finished}</p>
          <p className="text-xs text-ink-muted">Finalizadas</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-1">
          <p className="text-2xl font-bold text-warning">{pending}</p>
          <p className="text-xs text-ink-muted">Pendiente</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Clipboard size={56} className="text-ink-subtle" />
          <p className="text-ink-muted font-medium">Aún no has postulado a ninguna vacante.</p>
          <Button asChild>
            <Link href={ROUTES.candidato.vacantes}>Explorar vacantes →</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
