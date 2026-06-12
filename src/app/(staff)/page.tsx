import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { getDashboardData } from '@/features/dashboard/api/dashboardApi';
import { DashboardPage } from '@/features/dashboard/components/DashboardPage';
import { ROUTES } from '@/shared/constants/routes';

export default async function Page() {
  // Anonymous visitors land on the public job board instead of the staff dashboard.
  const store = await cookies();
  const token = store.get('access-token')?.value;
  if (!token) {
    redirect(ROUTES.publicVacantes);
  }

  const data = await getDashboardData();
  return <DashboardPage data={data} />;
}
