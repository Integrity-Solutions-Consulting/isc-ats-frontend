'use client';

import { useState } from 'react';

import { Badge } from '@/design-system/ui/badge';
import { Button } from '@/design-system/ui/button';
import {
  LEVEL_LABEL,
  WORK_MODE_LABEL,
  formatDuration,
} from '@/features/vacancies/labels';
import type { Vacancy } from '@/features/vacancies/types';
import { cn } from '@/shared/utils';

// ─── Collapsible description (needs useState so this file is 'use client') ───

interface CollapsibleTextProps {
  text: string;
}

function CollapsibleText({ text }: CollapsibleTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text.trim()) {
    return <p className="text-sm text-ink-subtle">Sin descripción disponible.</p>;
  }

  return (
    <div>
      <p
        className={cn(
          'text-sm text-ink whitespace-pre-wrap',
          !expanded && 'line-clamp-4',
        )}
      >
        {text}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 px-0 text-xs text-primary-600 hover:bg-transparent hover:text-primary-800"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Ver menos' : 'Ver más'}
      </Button>
    </div>
  );
}

// ─── Section card wrapper ────────────────────────────────────────────────────

function SectionCard({ title, children, className }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-4 shadow-sm', className)}>
      <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-subtle">{label}</span>
      <span className="text-sm text-ink">{value || '—'}</span>
    </div>
  );
}

// ─── Tag group ───────────────────────────────────────────────────────────────

function TagGroup({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-muted">{label}</p>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-subtle">Sin elementos</p>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface DetallesTabProps {
  vacancy: Vacancy;
}

export function DetallesTab({ vacancy }: DetallesTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Two-column row: General + Ubicación */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="General">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              label="Cargo"
              value={
                vacancy.positionDetail
                  ? `${vacancy.position} — ${vacancy.positionDetail}`
                  : vacancy.position
              }
            />
            <InfoRow label="Cliente" value={vacancy.clientCompany} />
            <InfoRow label="Contacto" value={vacancy.contact} />
            <InfoRow label="Departamento" value={vacancy.department} />
          </div>
        </SectionCard>

        <SectionCard title="Ubicación y modalidad">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow label="Ciudad" value={vacancy.city} />
            <InfoRow label="Modalidad" value={WORK_MODE_LABEL[vacancy.workMode] ?? vacancy.workMode} />
            <InfoRow
              label="Duración"
              value={formatDuration(vacancy.durationYears, vacancy.durationMonths)}
            />
            <InfoRow label="Carrera" value={vacancy.career} />
          </div>
        </SectionCard>
      </div>

      {/* Proceso y nivel */}
      <SectionCard title="Proceso y nivel">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoRow label="Proceso" value={vacancy.process} />
          <InfoRow label="Nivel" value={LEVEL_LABEL[vacancy.level] ?? vacancy.level} />
          <InfoRow
            label="Posiciones abiertas"
            value={`${vacancy.openings} recurso${vacancy.openings !== 1 ? 's' : ''}`}
          />
        </div>
      </SectionCard>

      {/* Perfil requerido */}
      <SectionCard title="Perfil requerido">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TagGroup label="Conocimientos" tags={vacancy.requirements.knowledge} />
          <TagGroup label="Herramientas" tags={vacancy.requirements.tools} />
          <TagGroup label="Habilidades" tags={vacancy.requirements.skills} />
          <TagGroup label="Certificaciones" tags={vacancy.requirements.certifications} />
        </div>
      </SectionCard>

      {/* Descripción */}
      <SectionCard title="Descripción del cargo">
        <CollapsibleText text={vacancy.description} />
      </SectionCard>
    </div>
  );
}
