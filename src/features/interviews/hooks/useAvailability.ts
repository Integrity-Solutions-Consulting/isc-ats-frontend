'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  createAvailability,
  deleteAvailability,
  listMyAvailability,
} from '../api/availabilityApi';
import type { AvailabilityCreatePayload, AvailabilityWindow } from '../types';

export const availabilityKeys = {
  mine: ['availability', 'mine'] as const,
};

export function useMyAvailability(): UseQueryResult<AvailabilityWindow[]> {
  return useQuery({ queryKey: availabilityKeys.mine, queryFn: listMyAvailability });
}

export function useCreateAvailability(): UseMutationResult<
  AvailabilityWindow,
  Error,
  AvailabilityCreatePayload
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvailability,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.mine });
    },
  });
}

export function useDeleteAvailability(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: availabilityKeys.mine });
    },
  });
}
