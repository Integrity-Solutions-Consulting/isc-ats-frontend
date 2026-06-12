import { AIAnalysisCard } from './AIAnalysisCard';
import type { AIAnalysis } from '@/features/candidates/types';

interface AIAnalysisReadOnlyBlockProps {
  analysis: AIAnalysis | null;
}

export function AIAnalysisReadOnlyBlock({ analysis }: AIAnalysisReadOnlyBlockProps) {
  if (!analysis) {
    return (
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">Análisis IA</p>
        <p className="text-sm text-ink-subtle">Sin análisis de IA aún.</p>
      </div>
    );
  }

  return <AIAnalysisCard analysis={analysis} />;
}
