'use client';

import { useEffect, useState } from 'react';

type AnalysisStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'unavailable' | 'superseded';
const labels: Record<AnalysisStatus, string> = {
  pending: 'CV guardado. Análisis pendiente; se intentará automáticamente.',
  queued: 'CV guardado. En espera de análisis.',
  processing: 'CV guardado. Analizando con IA…',
  completed: 'CV guardado. Análisis completado.',
  failed: 'CV guardado. No se pudo completar el análisis.',
  unavailable: 'CV guardado. Sin análisis disponible.',
  superseded: 'CV guardado. Sin análisis disponible.',
};

export function CvAnalysisStatus({ candidateId, fileId }: { candidateId: number; fileId: number }) {
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const url = `/api/candidate/cv/analysis?candidateId=${candidateId}`;

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json() as { status: AnalysisStatus };
          if (active) setStatus(data.status);
        }
      } catch { /* Retry the status request on the next interval. */ }
    };
    void poll();
    const timer = setInterval(poll, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [url, fileId]);

  const retry = async () => {
    setRetrying(true);
    setError('');
    try {
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error();
      setStatus('pending');
    } catch { setError('No se pudo solicitar el análisis. Intenta de nuevo.'); }
    finally { setRetrying(false); }
  };

  return <div className="mb-3 text-[12px]" role="status">
    <p className="text-ink-muted">{status ? labels[status] : 'CV guardado. Consultando estado del análisis…'}</p>
    {(status === 'failed' || status === 'unavailable' || status === 'superseded') &&
      <button type="button" disabled={retrying} onClick={retry} className="mt-1 text-primary underline disabled:opacity-50">
        {retrying ? 'Solicitando…' : 'Reintentar análisis'}
      </button>}
    {error && <p className="text-danger">{error}</p>}
  </div>;
}
