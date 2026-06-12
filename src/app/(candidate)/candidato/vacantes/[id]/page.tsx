import { notFound } from 'next/navigation';

import { getVacancy } from '@/features/candidate-portal/api/candidateApi';
import { VacancyDetailPage } from '@/features/candidate-portal/components/VacancyDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const vacancy = await getVacancy(id);
  if (!vacancy) notFound();
  return <VacancyDetailPage vacancy={vacancy} />;
}
