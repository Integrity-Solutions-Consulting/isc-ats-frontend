'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/shared/utils';
import type { Vacancy } from '@/features/vacancies/types';
import { PipelineBoard } from '@/features/pipeline/components/PipelineBoard';
import { DetallesTab } from './DetallesTab';
import { DocumentosTab } from './DocumentosTab';
import { ImagenesTab } from './ImagenesTab';

type TabKey = 'pipeline' | 'detalles' | 'imagenes' | 'documentos';

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'detalles', label: 'Detalles de la vacante' },
  { key: 'imagenes', label: 'Imágenes publicitarias' },
  { key: 'documentos', label: 'Documentos' },
];

interface VacancyTabsProps {
  vacancy: Vacancy;
  initialTab: string;
}

export function VacancyTabs({ vacancy, initialTab }: VacancyTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab') ?? initialTab;
  const activeTab = TABS.some((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : 'pipeline';

  function handleTabClick(key: TabKey) {
    router.replace(`${pathname}?tab=${key}`);
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
              activeTab === tab.key
                ? 'text-primary-700'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary-600" />
            )}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div className="pt-4">
        <Suspense
          fallback={
            <div className="flex h-40 items-center justify-center">
              <span className="text-sm text-ink-muted">Cargando...</span>
            </div>
          }
        >
          {activeTab === 'pipeline' && (
            <PipelineBoard vacancyId={vacancy.id} />
          )}
          {activeTab === 'detalles' && (
            <DetallesTab vacancy={vacancy} />
          )}
          {activeTab === 'imagenes' && (
            <ImagenesTab vacancy={vacancy} />
          )}
          {activeTab === 'documentos' && (
            <DocumentosTab vacancyId={vacancy.id} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
