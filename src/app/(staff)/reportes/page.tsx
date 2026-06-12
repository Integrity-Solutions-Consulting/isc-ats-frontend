import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/design-system/molecules/EmptyState';

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">Reportes</h1>
      <EmptyState
        icon={BarChart3}
        title="Reportes no disponibles"
        description="Esta sección estará habilitada próximamente."
        className="min-h-[300px]"
      />
    </div>
  );
}
