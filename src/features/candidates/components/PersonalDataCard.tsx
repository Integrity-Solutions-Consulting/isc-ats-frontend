'use client';

import { differenceInYears, parseISO } from 'date-fns';
import { Download, FileText } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import type { Candidate } from '@/features/candidates/types';

interface PersonalDataCardProps {
  candidate: Candidate;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  const d = parseISO(isoDate);
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
}

function computeAge(isoDate: string): number {
  if (!isoDate) return 0;
  return differenceInYears(new Date(), parseISO(isoDate));
}

function formatUploadDate(isoDatetime: string): string {
  const d = parseISO(isoDatetime);
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Undeclared experience reads as "No declarado", never as "0 años".
 *
 * The board lets recruiters filter by a minimum, so the two states must stay
 * distinguishable here too: claiming zero for someone who simply never answered
 * misreports them as having no experience at all.
 */
function formatExperience(years: number | null): string {
  if (years === null) return 'No declarado';
  const rounded = Number.isInteger(years) ? String(years) : years.toFixed(1);
  return `${rounded} ${years === 1 ? 'año' : 'años'}`;
}

// ─── Row helper ──────────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  value: string;
}

/**
 * An empty value reads as "No registrado" rather than as a blank line.
 *
 * Most of these fields are optional during onboarding, so blanks are common —
 * and a label with nothing under it looks like the screen failed to load rather
 * than like the candidate never answered.
 */
function Row({ label, value }: RowProps) {
  const isBlank = value.trim() === '';
  return (
    <div>
      <p className="text-xs text-ink-subtle">{label}</p>
      <p className={isBlank ? 'text-sm text-ink-subtle' : 'text-sm text-ink font-medium'}>
        {isBlank ? 'No registrado' : value}
      </p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PersonalDataCard({ candidate }: PersonalDataCardProps) {
  const age = computeAge(candidate.dateOfBirth);
  const dobFormatted = candidate.dateOfBirth ? formatDate(candidate.dateOfBirth) : null;

  return (
    <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
      <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
        Datos personales
      </p>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5">
        <Row label="Nombre completo" value={candidate.fullName} />
        {/* Foreign applicants register with a passport, and the number shown is
            theirs — labelling it "Cédula" would contradict what the candidate
            sees on their own profile for the same record. */}
        <Row
          label={candidate.docType === 'passport' ? 'Pasaporte' : 'Cédula'}
          value={candidate.nationalId}
        />
        {dobFormatted && (
          <Row
            label="Fecha de nacimiento"
            value={`${dobFormatted} · ${age} años`}
          />
        )}
        <Row label="Correo electrónico" value={candidate.email} />
        <Row label="Teléfono" value={candidate.phone} />
        <Row label="Ciudad" value={candidate.city} />
        <Row label="Dirección domiciliaria" value={candidate.homeAddress} />
        <Row label="Nivel de instrucción" value={candidate.educationLevel} />
        {/* Carrera and Título are separate answers in the candidate's own form.
            This card used to show the career under the "Título" label, so the
            recruiter was reading one field believing it was the other. */}
        <Row label="Carrera" value={candidate.career} />
        <Row label="Título" value={candidate.title} />
        <Row label="Universidad" value={candidate.university} />
        <Row
          label="Años de experiencia"
          value={formatExperience(candidate.yearsOfExperience)}
        />
        <Row label="Estudia actualmente" value={candidate.currentlyStudying ? 'Sí' : 'No'} />
        <Row
          label="Trabaja actualmente"
          value={
            candidate.currentlyEmployed
              ? `Sí${candidate.currentEmployer ? ` · ${candidate.currentEmployer}` : ''}`
              : 'No'
          }
        />
      </div>

      {/* CV row */}
      <div className="flex items-center gap-3 rounded-md bg-surface-2 border border-border px-3 py-2.5">
        <FileText className="h-5 w-5 shrink-0 text-ink-muted" />
        <div className="min-w-0 flex-1">
          {candidate.cv.fileId ? (
            <>
              <p className="truncate text-sm font-medium text-ink">{candidate.cv.fileName}</p>
              <p className="text-xs text-ink-subtle">
                Subido el {formatUploadDate(candidate.cv.uploadedAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-subtle">El candidato no ha subido su hoja de vida.</p>
          )}
        </div>
        {candidate.cv.fileId && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`${candidate.cv.url}?view=1`, '_blank')}
            >
              Ver
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={candidate.cv.url} download>
                <Download className="h-4 w-4" />
                Descargar
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
