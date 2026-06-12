import { cookies } from 'next/headers';
import type { Metadata } from 'next';

import { PublicLayout } from '@/features/public/components/PublicLayout';
import { PublicVacancyListPage } from '@/features/public/components/PublicVacancyListPage';
import { listPublicVacancies } from '@/features/public/api/publicVacanciesApi';

export const metadata: Metadata = {
  title: 'Vacantes · Mi Camello',
};

// Force dynamic rendering so cookies are read per-request (not statically
// cached), ensuring the auth-aware header reflects the current session.
export const dynamic = 'force-dynamic';

export default async function PublicVacantesPage() {
  const [vacancies, store] = await Promise.all([
    listPublicVacancies(),
    cookies(),
  ]);

  const isAuthenticated = !!store.get('access-token')?.value;
  let portalHref: string | undefined;
  if (isAuthenticated) {
    const rawSession = store.get('session-user')?.value;
    let portal = 'candidate';
    try {
      const parsed = JSON.parse(rawSession ?? '{}') as { portal?: string };
      portal = parsed.portal ?? 'candidate';
    } catch {}
    portalHref = portal === 'staff' ? '/' : '/candidato/vacantes';
  }

  return (
    <PublicLayout portalHref={portalHref}>
      <PublicVacancyListPage vacancies={vacancies} />
    </PublicLayout>
  );
}
