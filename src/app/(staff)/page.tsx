import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { buildDashboardData } from '@/features/dashboard/api/buildDashboardData';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { ROUTES } from '@/shared/constants/routes';

export default async function Page() {
  const store = await cookies();
  const token = store.get('access-token')?.value;
  if (!token) {
    redirect(ROUTES.publicVacantes);
  }

  const data = await buildDashboardData();
  return <DashboardPage data={data} />;
}
