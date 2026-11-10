'use client';

import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { Button } from '@/design-system/ui/button';
import type { CandidateDirectoryEntry } from '@/features/candidates/types';
import type { PipelineCard } from '../types';

interface ExportApplicantsButtonProps {
  cards: PipelineCard[];
  entries: CandidateDirectoryEntry[];
  vacancy: { position: string; clientCompany: string };
  disabled?: boolean;
}

export function ExportApplicantsButton({ cards, entries, vacancy, disabled }: ExportApplicantsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    try {
      const [{ buildApplicantsReport }, { exportSpreadsheet }, { loadBrandLogo }] = await Promise.all([
        import('../export/buildApplicantsReport'),
        import('@/shared/export/spreadsheet'),
        import('@/shared/export/brandLogo'),
      ]);
      const report = buildApplicantsReport({ cards, entries, vacancy, origin: window.location.origin, logo: await loadBrandLogo() });
      const blob = await exportSpreadsheet(report);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const slug = vacancy.position.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
      link.href = url;
      link.download = `postulantes-${slug || 'vacante'}-${report.generatedAt.toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Leave the URL alive until the browser has started reading the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo descargar el Excel. Intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={disabled || isExporting || cards.length === 0}
        aria-busy={isExporting}
        title={cards.length ? `Exportar los ${cards.length} postulantes que coinciden con los filtros` : 'No hay postulantes para exportar'}
        onClick={() => void handleExport()}
      >
        {isExporting ? <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Download aria-hidden="true" />}
        {isExporting ? 'Generando Excel…' : 'Descargar Excel'}
      </Button>
      {isExporting && <span role="status" className="text-xs text-ink-muted">Preparando {cards.length} postulantes…</span>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
