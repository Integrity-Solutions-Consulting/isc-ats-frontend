import { listVacancies } from '@/features/candidate-portal/api/candidateApi';
import { VacancyListPage } from '@/features/candidate-portal/components/VacancyListPage';

export default async function Page() {
  const vacancies = await listVacancies();
  return <VacancyListPage vacancies={vacancies} />;
}
