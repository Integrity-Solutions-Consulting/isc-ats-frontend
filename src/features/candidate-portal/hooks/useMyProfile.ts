'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getMyProfile } from '../api/candidateApi';
import type { CandidateProfile } from '../types';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const myProfileKeys = {
  all: ['my-profile'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * The authenticated candidate's own profile. Backed by React Query so any
 * consumer (e.g. the TopNav avatar) re-renders when the profile is invalidated
 * after an edit — no full page reload needed.
 */
export function useMyProfile(): UseQueryResult<CandidateProfile | null> {
  return useQuery({
    queryKey: myProfileKeys.all,
    queryFn: getMyProfile,
  });
}
