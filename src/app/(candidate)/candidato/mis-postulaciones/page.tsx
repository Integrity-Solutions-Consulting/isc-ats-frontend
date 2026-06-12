import { getMyApplications } from '@/features/candidate-portal/api/candidateApi';
import { MyApplicationsPage } from '@/features/candidate-portal/components/MyApplicationsPage';

export default async function Page() {
  const applications = await getMyApplications();
  return <MyApplicationsPage applications={applications} />;
}
