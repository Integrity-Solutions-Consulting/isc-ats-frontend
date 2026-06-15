import type { CandidateProfile } from '../types';
import { PersonalInfoCard } from './my-profile/PersonalInfoCard';
import { ResumeCard } from './my-profile/ResumeCard';
import { SecurityCard } from './my-profile/SecurityCard';
import { DangerZoneCard } from './my-profile/DangerZoneCard';

interface MyProfilePageProps {
  profile: CandidateProfile;
}

export function MyProfilePage({ profile }: MyProfilePageProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.67fr]">
      {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
      <div>
        <PersonalInfoCard profile={profile} />
      </div>

      {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <ResumeCard profile={profile} />
        <SecurityCard />
        <DangerZoneCard />
      </div>
    </div>
  );
}
