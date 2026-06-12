'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PlantillaForm } from '@/features/profile-templates/components/PlantillaForm';
import { getTemplate } from '@/features/profile-templates/api/profileTemplatesApi';

export default function Page() {
  const { id } = useParams<{ id: string }>();

  const { data: template, isLoading } = useQuery({
    queryKey: ['profile-templates', id],
    queryFn: () => getTemplate(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
    );
  }

  if (!template) {
    return <p className="text-sm text-danger">Plantilla no encontrada.</p>;
  }

  return <PlantillaForm mode="edit" initialValues={template} />;
}
