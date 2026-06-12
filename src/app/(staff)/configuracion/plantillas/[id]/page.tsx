import { PlantillaDetailPage } from '@/features/profile-templates/components/PlantillaDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlantillaDetailPage id={id} />;
}
