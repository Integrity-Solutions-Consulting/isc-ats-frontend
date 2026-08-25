'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/design-system/ui/button';
import { fetchSubscriberCount } from '../api/subscribersApi';

/** Staff-only page (Marketing role): shows how many candidates are currently
 *  subscribed to marketing communications and lets them download the list. */
export function SubscribersPage() {
  const { data: count, isLoading, isError } = useQuery({
    queryKey: ['subscribers', 'count'],
    queryFn: fetchSubscriberCount,
  });

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch('/api/auth/subscribers/export');
      if (!res.ok) throw new Error('Error al generar el archivo');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'suscriptores.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError('No fue posible descargar el archivo. Intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">Suscriptores</h1>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-6">
        <div>
          <p className="text-sm text-ink-muted">Suscritos a comunicaciones de marketing</p>
          <p className="mt-1 text-3xl font-bold text-ink">
            {isLoading ? '—' : isError ? '—' : count}
          </p>
          {isError && (
            <p className="mt-1 text-sm text-danger">No fue posible obtener el número de suscriptores.</p>
          )}
        </div>
        <Button onClick={handleDownload} disabled={downloading}>
          <Download className="mr-1.5 size-4" />
          {downloading ? 'Descargando…' : 'Descargar Excel'}
        </Button>
      </div>

      {downloadError && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{downloadError}</p>
      )}
    </div>
  );
}
