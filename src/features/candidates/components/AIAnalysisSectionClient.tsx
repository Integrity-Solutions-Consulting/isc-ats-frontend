'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/design-system/ui/button';
import { AIAnalysisCard } from '@/features/candidates/components/AIAnalysisCard';
import type { AIAnalysis } from '@/features/candidates/types';

type Status = 'idle' | 'analyzing' | 'done' | 'error';

function deriveStatus(analysis: AIAnalysis | null): Status {
  if (!analysis) return 'idle';
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
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userTriggeredRef = useRef(false);
  // Whether we already sent the auto-trigger POST for a stuck analysis
  const autoTriggeredRef = useRef(false);

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
      if (data && !data.isAnalyzing) {
        setAnalysis(data);
        setStatus('done');
        stopPolling();
      }
    } catch {
      // keep polling on transient errors
    }
  }, [applicationId, stopPolling]);

  useEffect(() => {
    if (status !== 'analyzing') return;
    pollRef.current = setInterval(poll, 3000);
    return stopPolling;
  }, [status, poll, stopPolling]);

  // Auto-trigger when the page loads with a stuck analysis (isAnalyzing from server,
  // not triggered by the user in this session). Covers the case where the backend
  // BackgroundTask was dropped (e.g. uvicorn --reload worker restart in dev).
  useEffect(() => {
    if (
      status === 'analyzing' &&
      !userTriggeredRef.current &&
      !autoTriggeredRef.current &&
      initialAnalysis?.isAnalyzing === true
    ) {
      autoTriggeredRef.current = true;
      fetch(`/api/recruitment/applications/${applicationId}/analysis`, { method: 'POST' }).catch(() => null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAnalyze() {
    userTriggeredRef.current = true;
    setStatus('analyzing');
    setAnalysis(STUCK_ANALYSIS);
    try {
      const res = await fetch(`/api/recruitment/applications/${applicationId}/analysis`, { method: 'POST' });
      if (!res.ok) {
        userTriggeredRef.current = false;
        setStatus('error');
        setAnalysis(null);
      }
    } catch {
      userTriggeredRef.current = false;
      setStatus('error');
      setAnalysis(null);
    }
  }

  if (status === 'idle' || status === 'error') {
    return (
      <div className="bg-surface rounded-lg border border-border shadow-sm p-5">
        <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">Análisis IA</p>
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-muted">
            {status === 'error'
              ? 'No se pudo iniciar el análisis. Intentá de nuevo.'
              : 'No hay análisis disponible para esta postulación.'}
          </p>
          <Button size="sm" variant="outline" onClick={handleAnalyze}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analizar CV
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'analyzing') {
    return <AIAnalysisCard analysis={analysis ?? STUCK_ANALYSIS} />;
  }

  if (!analysis) return null;

  return <AIAnalysisCard analysis={analysis} />;
}
