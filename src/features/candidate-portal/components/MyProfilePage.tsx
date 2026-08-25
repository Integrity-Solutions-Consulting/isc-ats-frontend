'use client';

import { useState } from 'react';
import type { CandidateProfile } from '../types';
import { PersonalInfoCard } from './my-profile/PersonalInfoCard';
import { ResumeCard } from './my-profile/ResumeCard';
import { SecurityCard } from './my-profile/SecurityCard';
import { DangerZoneCard } from './my-profile/DangerZoneCard';
import { MarketingConsentCard } from './my-profile/MarketingConsentCard';
import { MarketingConsentModal } from './my-profile/MarketingConsentModal';

interface MyProfilePageProps {
  profile: CandidateProfile;
}

export function MyProfilePage({ profile }: MyProfilePageProps) {
  const [decided, setDecided] = useState(profile.marketingConsentDecided);
  const [subscribed, setSubscribed] = useState(profile.marketingConsentSubscribed);

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
        {/* Keyed on `subscribed` so the card remounts (re-syncs its internal
            optimistic state) when the modal decision changes it externally --
            it would otherwise keep the stale value it was first mounted with. */}
        <MarketingConsentCard key={String(subscribed)} subscribed={subscribed} />
        <DangerZoneCard />
      </div>

      <MarketingConsentModal
        open={!decided}
        onDecided={(newSubscribed) => {
          setSubscribed(newSubscribed);
          setDecided(true);
        }}
      />
    </div>
  );
}
