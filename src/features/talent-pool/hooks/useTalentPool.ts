'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listTalentPool, removeFromTalentPool } from '../api/talentPoolApi';

const KEYS = {
  all: ['talent-pool'] as const,
  list: () => ['talent-pool', 'list'] as const,
};

export function useTalentPool() {
  return useQuery({ queryKey: KEYS.list(), queryFn: listTalentPool });
}

export function useRemoveFromTalentPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeFromTalentPool,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
    onError: (error: Error) => {
      console.error('[useRemoveFromTalentPool]', error);
    },
  });
}
