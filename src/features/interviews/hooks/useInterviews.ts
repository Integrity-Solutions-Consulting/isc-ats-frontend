'use client';

import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  createInterview,
  getAvailableSlots,
  listInterviewers,
  offerSlots,
} from '../api/interviewsApi';
import type {
  CreateInterviewPayload,
  Interviewer,
  OfferSlotsPayload,
  Slot,
} from '../types';

export const interviewKeys = {
  interviewers: ['interviews', 'interviewers'] as const,
  slots: (interviewerId: number, date: string) =>
    ['interviews', 'slots', interviewerId, date] as const,
};

export function useInterviewers(): UseQueryResult<Interviewer[]> {
  return useQuery({
    queryKey: interviewKeys.interviewers,
    queryFn: listInterviewers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAvailableSlots(
  interviewerId: number | null,
  targetDate: string,
): UseQueryResult<Slot[]> {
  return useQuery({
    queryKey: interviewKeys.slots(interviewerId ?? 0, targetDate),
    queryFn: () => getAvailableSlots(interviewerId as number, targetDate),
    enabled: interviewerId != null && targetDate.length > 0,
  });
}

export function useCreateInterview(): UseMutationResult<void, Error, CreateInterviewPayload> {
  return useMutation({ mutationFn: createInterview });
}

export function useOfferSlots(): UseMutationResult<void, Error, OfferSlotsPayload> {
  return useMutation({ mutationFn: offerSlots });
}
