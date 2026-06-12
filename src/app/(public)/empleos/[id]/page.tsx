import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

import { PublicLayout } from '@/features/public/components/PublicLayout';
import { PublicVacancyDetailPage } from '@/features/public/components/PublicVacancyDetailPage';
import { getPublicVacancy } from '@/features/public/api/publicVacanciesApi';
import { ROUTES } from '@/shared/constants/routes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vacancy = await getPublicVacancy(id);
  return {
    title: vacancy ? `${vacancy.title} · Mi Camello` : 'Vacante · Mi Camello',
  };
}

export default async function PublicVacanteDetailPage({ params }: PageProps) {
  const { id } = await params;

  const store = await cookies();
  const isAuthenticated = !!store.get('access-token')?.value;

  if (isAuthenticated) {
    const rawSession = store.get('session-user')?.value;
    let portal = 'candidate';
    try {
      const parsed = JSON.parse(rawSession ?? '{}') as { portal?: string };
      portal = parsed.portal ?? 'candidate';
    } catch {}

    // Authenticated candidates always land in their portal detail page.
    // Staff users keep seeing the public page (harmless — they can access /empleos*).
    if (portal === 'candidate') {
      redirect(ROUTES.candidato.vacante(id));
    }
  }

  const vacancy = await getPublicVacancy(id);
  if (!vacancy) notFound();

  // At this point: anonymous visitor or staff user.
  let portalHref: string | undefined;
  if (isAuthenticated) {
    // Only staff reaches here authenticated; point them at their dashboard.
    portalHref = '/';
  }

  return (
    <PublicLayout portalHref={portalHref}>
      <PublicVacancyDetailPage vacancy={vacancy} isAuthenticated={isAuthenticated} />
    </PublicLayout>
  );
}
