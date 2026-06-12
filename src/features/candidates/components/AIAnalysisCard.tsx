import { AlertCircle, CheckCircle2, Clock, FileX } from 'lucide-react';

import { cn } from '@/shared/utils';
import type { AIAnalysis, AIExtractedTag, AITagMatch } from '@/features/candidates/types';

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
}

// ─── Tag dot ─────────────────────────────────────────────────────────────────

function tagDotClass(match: AITagMatch): string {
  if (match === 'match') return 'bg-success';
  if (match === 'miss') return 'bg-danger';
  return 'bg-ink-subtle';
}

// ─── Tag grid section ────────────────────────────────────────────────────────

interface TagSectionProps {
  title: string;
  tags: AIExtractedTag[];
}

function TagSection({ title, tags }: TagSectionProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-ink-muted uppercase tracking-wide">
        {title}
      </p>
      {tags.length === 0 ? (
        <p className="text-xs text-ink-subtle">Ninguna encontrada en el CV</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-ink"
            >
              <span
                className={cn('h-2 w-2 rounded-full shrink-0', tagDotClass(tag.match))}
              />
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AIAnalysisCard({ analysis }: AIAnalysisCardProps) {
  if (analysis.isAnalyzing) {
    return (
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">Análisis IA</p>
        <div className="flex items-center gap-3 text-ink-muted">
          <Clock className="h-5 w-5 shrink-0 animate-pulse text-primary-400" />
          <p className="text-sm">Análisis en progreso — estará disponible en unos segundos.</p>
        </div>
      </div>
    );
  }

  if (analysis.noTextLayer) {
    return (
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">Análisis IA</p>
        <div className="flex items-center gap-3 text-ink-muted">
          <FileX className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm">El CV no contiene texto extraíble (posiblemente escaneado). No se puede analizar automáticamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
      <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">
        Análisis IA
      </p>

      {/* Match score + summary */}
      <div className="flex gap-6 mb-5">
        {/* Score circle */}
        <div className="flex flex-col items-center justify-center rounded-full border-4 border-primary-100 bg-primary-50 h-24 w-24 shrink-0">
          <span className="text-2xl font-bold text-primary-600">{analysis.matchPercent}%</span>
          <span className="text-xs text-ink-muted">match</span>
        </div>

        {/* Summary */}
        <p className="text-sm text-ink-muted leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Fortalezas
          </p>
          <ul className="space-y-1">
            {analysis.strengths.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {analysis.gaps.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Brechas
          </p>
          <ul className="space-y-1">
            {analysis.gaps.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tag grids — 2×2 */}
      <div className="grid grid-cols-2 gap-4">
        <TagSection title="Conocimientos" tags={analysis.skills} />
        <TagSection title="Herramientas" tags={analysis.tools} />
        <TagSection title="Habilidades" tags={analysis.softSkills} />
        <TagSection title="Certificaciones" tags={analysis.certifications} />
      </div>
    </div>
  );
}
