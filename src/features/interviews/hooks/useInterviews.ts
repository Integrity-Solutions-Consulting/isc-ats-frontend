'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  createInterview,
  getAvailableSlots,
  listAllInterviews,
  listInterviewers,
  offerSlots,
} from '../api/interviewsApi';
import type {
  CreateInterviewPayload,
  InterviewListPage,
  InterviewListParams,
  Interviewer,
  OfferSlotsPayload,
  Slot,
} from '../types';

export const interviewKeys = {
  interviewers: ['interviews', 'interviewers'] as const,
  slots: (interviewerId: number, date: string) =>
    ['interviews', 'slots', interviewerId, date] as const,
  all: (params: InterviewListParams) => ['interviews', 'all', params] as const,
};

export function useInterviewers(): UseQueryResult<Interviewer[]> {
  return useQuery({
    queryKey: interviewKeys.interviewers,
    queryFn: listInterviewers,
    // Fresh on open so a newly-configured interviewer is selectable right away.
    staleTime: 0,
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

/** Talento Humano / Admin: paginated list of ALL interviews across vacancies. */
export function useAllInterviews(params: InterviewListParams): UseQueryResult<InterviewListPage> {
  return useQuery({
    queryKey: interviewKeys.all(params),
    queryFn: () => listAllInterviews(params),
    // Keep the previous page's rows visible while the next page loads, instead
    // of flashing the table's loading state on every click.
    placeholderData: keepPreviousData,
  });
}

export function useCreateInterview(): UseMutationResult<void, Error, CreateInterviewPayload> {
  return useMutation({ mutationFn: createInterview });
}

export function useOfferSlots(): UseMutationResult<void, Error, OfferSlotsPayload> {
  return useMutation({ mutationFn: offerSlots });
}
