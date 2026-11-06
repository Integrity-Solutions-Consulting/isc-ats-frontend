import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CvAnalysisStatus } from './CvAnalysisStatus';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('CV analysis state', () => {
  it('keeps the saved CV visible during failure and lets the user retry', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'failed' }) })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetcher);
    render(<CvAnalysisStatus candidateId={7} fileId={8} />);
    expect(await screen.findByText('CV guardado. No se pudo completar el análisis.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar análisis' }));
    expect(await screen.findByText(/Análisis pendiente/)).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith('/api/candidate/cv/analysis?candidateId=7', { method: 'POST' });
  });

  it('updates a pending task to completed without uploading the PDF again', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'pending' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed' }) });
    vi.stubGlobal('fetch', fetcher);
    await act(async () => { render(<CvAnalysisStatus candidateId={7} fileId={8} />); });
    expect(screen.getByText(/Análisis pendiente/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(screen.getByText('CV guardado. Análisis completado.')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
