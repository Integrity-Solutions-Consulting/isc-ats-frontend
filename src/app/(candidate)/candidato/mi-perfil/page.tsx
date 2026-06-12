import { getMyProfile } from '@/features/candidate-portal/api/candidateApi';
import { MyProfilePage } from '@/features/candidate-portal/components/MyProfilePage';

export default async function Page() {
  const profile = await getMyProfile();
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-ink-muted">No se encontró tu perfil. Completá tu registro primero.</p>
      </div>
    );
  }
  return <MyProfilePage profile={profile} />;
}
