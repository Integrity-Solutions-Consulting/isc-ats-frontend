'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { pipelineKeys } from '@/features/pipeline/hooks/usePipeline';
// pipelineKeys is intentionally imported from features/pipeline: invalidating the
// pipeline query cache after a stage move is a coordinated cross-domain side-effect,
// not a type dependency. This is documented here so the coupling stays explicit.
import {
  addNote,
  addToTalentPool,
  getAIAnalysis,
  getCandidateApplication,
  getCandidateNotes,
  getOtherApplications,
  moveToNextStage,
  rejectCandidate,
  updateStageStatus,
} from '../api/candidatesApi';
import type {
  AIAnalysis,
  CandidateApplication,
  CandidateNote,
  OtherApplication,
} from '../types';
import type { CandidateStageStatus } from '@/shared/types/pipeline';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const candidateKeys = {
  all: ['candidates'] as const,
  application: (applicationId: string) =>
    ['candidates', 'application', applicationId] as const,
  aiAnalysis: (applicationId: string) =>
    ['candidates', 'ai-analysis', applicationId] as const,
  notes: (applicationId: string) =>
    ['candidates', 'notes', applicationId] as const,
  otherApplications: (candidateId: string) =>
    ['candidates', 'other-applications', candidateId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useCandidateApplication(
  applicationId: string,
): UseQueryResult<CandidateApplication | null> {
  return useQuery({
    queryKey: candidateKeys.application(applicationId),
    queryFn: () => getCandidateApplication(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useAIAnalysis(
  applicationId: string,
): UseQueryResult<AIAnalysis | null> {
  return useQuery({
    queryKey: candidateKeys.aiAnalysis(applicationId),
    queryFn: () => getAIAnalysis(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useCandidateNotes(
  applicationId: string,
): UseQueryResult<CandidateNote[]> {
  return useQuery({
    queryKey: candidateKeys.notes(applicationId),
    queryFn: () => getCandidateNotes(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useOtherApplications(
  candidateId: string,
): UseQueryResult<OtherApplication[]> {
  return useQuery({
    queryKey: candidateKeys.otherApplications(candidateId),
    queryFn: () => getOtherApplications(candidateId),
    enabled: Boolean(candidateId),
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useAddNote(applicationId: string): UseMutationResult<
  CandidateNote,
  Error,
  { body: string; author: { name: string; initials: string } }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, author }) => addNote(applicationId, body, author),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.notes(applicationId) });
    },
    onError: (error: Error) => {
      console.error('[useAddNote]', error);
    },
  });
}

export function useMoveToNextStage(): UseMutationResult<
  void,
  Error,
  { applicationId: string; toStageId: string; vacancyId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, toStageId }) =>
      moveToNextStage(applicationId, toStageId),
    onSuccess: (_data, { applicationId, vacancyId }) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.pipeline(vacancyId),
      });
      queryClient.invalidateQueries({
        queryKey: candidateKeys.application(applicationId),
      });
    },
  });
}

export function useUpdateStageStatus(): UseMutationResult<
  void,
  Error,
  { applicationId: string; statusId: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, statusId }) =>
      updateStageStatus(applicationId, statusId),
    onSuccess: (_data, { applicationId }) => {
      queryClient.invalidateQueries({
        queryKey: candidateKeys.application(applicationId),
      });
    },
  });
}

export function useRejectCandidate(): UseMutationResult<
  void,
  Error,
  { applicationId: string; vacancyId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId }) => rejectCandidate(applicationId),
    onSuccess: (_data, { applicationId, vacancyId }) => {
      queryClient.invalidateQueries({
        queryKey: pipelineKeys.pipeline(vacancyId),
      });
      queryClient.invalidateQueries({
        queryKey: candidateKeys.application(applicationId),
      });
    },
  });
}

export function useAddToTalentPool(): UseMutationResult<
  void,
  Error,
  { candidateId: string; vacancyId: string }
> {
  return useMutation({
    mutationFn: ({ candidateId, vacancyId }) => addToTalentPool(candidateId, vacancyId),
  });
}
