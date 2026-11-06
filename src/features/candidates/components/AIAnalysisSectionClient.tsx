'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { AIAnalysisCard } from '@/features/candidates/components/AIAnalysisCard';
import type { AIAnalysis } from '@/features/candidates/types';

type Status = 'idle' | 'analyzing' | 'done' | 'error';

function deriveStatus(analysis: AIAnalysis | null): Status {
  if (!analysis) return 'idle';
  if (analysis.analysisStatus === 'failed') return 'error';
  if (analysis.analysisStatus === 'unavailable' || analysis.analysisStatus === 'superseded') return 'idle';
  if (analysis.isAnalyzing) return 'analyzing';
  return 'done';
}

const STUCK_ANALYSIS: AIAnalysis = {
  isAnalyzing: true,
  matchPercent: null,
  summary: '',
  strengths: [],
  gaps: [],
  skills: [],
  tools: [],
  softSkills: [],
  certifications: [],
};

interface Props {
  applicationId: string;
  initialAnalysis: AIAnalysis | null;
}

export function AIAnalysisSectionClient({ applicationId, initialAnalysis }: Props) {
  const [status, setStatus] = useState<Status>(() => deriveStatus(initialAnalysis));
  const [starting, setStarting] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/recruitment/applications/${applicationId}/analysis`);
      if (!res.ok) return;
      const data: AIAnalysis | null = await res.json();
      if (data) {
        setAnalysis(data);
        const nextStatus = deriveStatus(data);
        setStatus(nextStatus);
        if (nextStatus !== 'analyzing') stopPolling();
      }

    } catch {
      // keep polling on transient errors
    }
  }, [applicationId, stopPolling]);

  useEffect(() => {
    if (status !== 'analyzing' && status !== 'idle') return;
    const initialPoll = setTimeout(poll, 0);
    pollRef.current = setInterval(poll, 3000);
    return () => { clearTimeout(initialPoll); stopPolling(); };
  }, [status, poll, stopPolling]);

  async function handleAnalyze() {
    setStarting(true);
    try {
      const res = await fetch(`/api/recruitment/applications/${applicationId}/analysis`, { method: 'POST' });
      if (!res.ok) {
        setStatus('error');
        setAnalysis(null);
      } else {
        setAnalysis(STUCK_ANALYSIS);
        setStatus('analyzing');
      }
    } catch {
      setStatus('error');
      setAnalysis(null);
    } finally {
      setStarting(false);
    }
  }

  if (status === 'idle' || status === 'error') {
    return (
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">Análisis IA</p>
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-muted">
            {status === 'error'
              ? 'El CV sigue guardado. No se pudo completar el análisis; puedes reintentarlo.'
              : 'No hay análisis disponible para esta postulación.'}
          </p>
          <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={starting}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analizar CV
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'analyzing') {
    return <div>
      <p className="mb-2 text-sm text-ink-muted" role="status">
        {analysis?.analysisStatus === 'pending' ? 'Análisis pendiente. Se reintentará automáticamente.'
          : analysis?.analysisStatus === 'queued' ? 'En espera de análisis.' : 'Procesando análisis de IA…'}
      </p>
      <AIAnalysisCard analysis={analysis ?? STUCK_ANALYSIS} />
    </div>;
  }

  if (!analysis) return null;

  return <AIAnalysisCard analysis={analysis} />;
}
