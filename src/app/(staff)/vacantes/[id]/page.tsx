import { notFound } from 'next/navigation';

import { getVacancy } from '@/features/vacancies/api/vacanciesApi';
import { getVacancyStats } from '@/features/pipeline/api/pipelineApi';
import { VacancyStrip } from '@/features/vacancies/components/VacancyStrip';
import { VacancyTabs } from '@/features/vacancies/components/VacancyTabs';
import { VacancyBreadcrumbSetter } from '@/features/vacancies/components/VacancyBreadcrumbSetter';

export default async function VacancyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'pipeline' } = await searchParams;

  const [vacancy, stats] = await Promise.all([
    getVacancy(id),
    getVacancyStats(id),
  ]);

  if (!vacancy) notFound();

  return (
    <div className="flex flex-col gap-6">
      <VacancyBreadcrumbSetter name={vacancy.position} />
      <VacancyStrip vacancy={vacancy} stats={stats} />
      <VacancyTabs vacancy={vacancy} initialTab={tab} />
    </div>
  );
}
