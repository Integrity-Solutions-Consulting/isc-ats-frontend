'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  getVacancyDocuments,
  getVacancyPipeline,
  movePipelineCard,
} from '../api/pipelineApi';
import type { VacancyDocument, VacancyPipeline } from '../types';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const pipelineKeys = {
  all: ['pipeline'] as const,
  pipeline: (vacancyId: string) => ['pipeline', vacancyId] as const,
  documents: (vacancyId: string) => ['pipeline', vacancyId, 'documents'] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function usePipeline(vacancyId: string): UseQueryResult<VacancyPipeline> {
  return useQuery({
    queryKey: pipelineKeys.pipeline(vacancyId),
    queryFn: () => getVacancyPipeline(vacancyId),
    enabled: Boolean(vacancyId),
    select(data) {
      return data;
    },
    refetchInterval(query) {
      const data = query.state.data as VacancyPipeline | undefined;
      const hasAnalyzing = data?.cards.some((c) => c.matchStatus === 'analyzing');
      return hasAnalyzing ? 5000 : false;
    },
  });
}

export function useMovePipelineCard(): UseMutationResult<
  void,
  Error,
  { cardId: string; toStageId: string; fromStageId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, toStageId }) => movePipelineCard(cardId, toStageId),

    onMutate: async ({ cardId, toStageId, fromStageId }) => {
      // Find which vacancy this card belongs to by looking through cached pipelines
      const queryCache = queryClient.getQueryCache();
      const pipelineQueries = queryCache
        .getAll()
        .filter((q) => q.queryKey[0] === 'pipeline' && q.queryKey.length === 2);

      let targetVacancyId: string | undefined;
      let previousData: VacancyPipeline | undefined;

      for (const q of pipelineQueries) {
        const data = q.state.data as VacancyPipeline | undefined;
        if (data?.cards.some((c) => c.id === cardId)) {
          targetVacancyId = q.queryKey[1] as string;
          previousData = data;
          break;
        }
      }

      if (!targetVacancyId || !previousData) return { previousData: undefined, targetVacancyId: undefined };

      const queryKey = pipelineKeys.pipeline(targetVacancyId);
      await queryClient.cancelQueries({ queryKey });

      // Optimistic update: move the card to the new stage
      queryClient.setQueryData<VacancyPipeline>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) =>
            c.id === cardId ? { ...c, stageId: toStageId } : c,
          ),
        };
      });

      return { previousData, targetVacancyId, fromStageId };
    },

    onError: (_err, _vars, context) => {
      // Rollback on error
      const ctx = context as { previousData?: VacancyPipeline; targetVacancyId?: string } | undefined;
      if (ctx?.targetVacancyId && ctx?.previousData) {
        queryClient.setQueryData(
          pipelineKeys.pipeline(ctx.targetVacancyId),
          ctx.previousData,
        );
      }
    },

    onSettled: (_data, _err, _vars, context) => {
      // Refetch the pipeline so server-computed aggregates (hiredCount,
      // rejectionSummary, match) reflect the move — the optimistic update only
      // shifts the card's stageId and cannot recompute those counts.
      const ctx = context as { targetVacancyId?: string } | undefined;
      if (ctx?.targetVacancyId) {
        queryClient.invalidateQueries({ queryKey: pipelineKeys.pipeline(ctx.targetVacancyId) });
      }
    },
  });
}

export function useVacancyDocuments(vacancyId: string): UseQueryResult<VacancyDocument[]> {
  return useQuery({
    queryKey: pipelineKeys.documents(vacancyId),
    queryFn: () => getVacancyDocuments(vacancyId),
    enabled: Boolean(vacancyId),
  });
}
