'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Tabs } from '@/design-system/molecules/Tabs';
import type { Vacancy } from '@/features/vacancies/types';
import { PipelineBoard } from '@/features/pipeline/components/PipelineBoard';
import { DetallesTab } from './DetallesTab';
import { DocumentosTab } from './DocumentosTab';
import { ImagenesTab } from './ImagenesTab';

type TabKey = 'pipeline' | 'detalles' | 'imagenes' | 'documentos';

const TAB_ITEMS = [
  { value: 'pipeline',   label: 'Pipeline' },
  { value: 'detalles',   label: 'Detalles de la vacante' },
  { value: 'imagenes',   label: 'Imágenes publicitarias' },
  { value: 'documentos', label: 'Documentos' },
] satisfies { value: TabKey; label: string }[];

interface VacancyTabsProps {
  vacancy: Vacancy;
  initialTab: string;
}

export function VacancyTabs({ vacancy, initialTab }: VacancyTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab') ?? initialTab;
  const activeTab = TAB_ITEMS.some((t) => t.value === rawTab)
    ? (rawTab as TabKey)
    : 'pipeline';

  function handleTabChange(value: string) {
    router.replace(`${pathname}?tab=${value}`);
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Tab bar */}
      <div className="border-b border-border pb-0">
        <Tabs
          items={TAB_ITEMS}
          value={activeTab}
          onValueChange={handleTabChange}
          className="-mb-px"
        />
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="pt-4"
      >
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
