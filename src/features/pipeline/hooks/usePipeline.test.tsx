import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { movePipelineCard } from '../api/pipelineApi';
import type { VacancyPipeline } from '../types';
import { pipelineKeys, useMovePipelineCard, usePendingPipelineCards } from './usePipeline';

vi.mock('../api/pipelineApi', () => ({ movePipelineCard: vi.fn() }));

it('tracks concurrent saves per card and rolls back a failure without undoing another save', async () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const key = pipelineKeys.pipeline('vacancy');
  client.setQueryData(key, { cards: [{ id: 'a', stageId: 'old' }, { id: 'b', stageId: 'old' }], stages: [], rejectionSummary: { total: 0, reasons: [] } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  let failA!: (error: Error) => void;
  let finishB!: () => void;
  vi.mocked(movePipelineCard)
    .mockImplementationOnce(() => new Promise<void>((_, reject) => { failA = reject; }))
    .mockImplementationOnce(() => new Promise<void>((resolve) => { finishB = resolve; }));
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => ({ mutation: useMovePipelineCard(), pending: usePendingPipelineCards() }), { wrapper });
  let first!: Promise<unknown>;
  let second!: Promise<unknown>;
  act(() => {
    first = result.current.mutation.mutateAsync({ cardId: 'a', fromStageId: 'old', toStageId: 'new' }).catch(() => undefined);
    second = result.current.mutation.mutateAsync({ cardId: 'b', fromStageId: 'old', toStageId: 'new' });
  });
  await waitFor(() => expect(result.current.pending).toEqual(['a', 'b']));
  expect(client.getQueryData<VacancyPipeline>(key)?.cards.map((card) => card.stageId)).toEqual(['new', 'new']);
  await act(async () => { failA(new Error('Failed')); await first; });
  expect(client.getQueryData<VacancyPipeline>(key)?.cards.map((card) => card.stageId)).toEqual(['old', 'new']);
  expect(invalidate).not.toHaveBeenCalled();
  await waitFor(() => expect(result.current.pending).toEqual(['b']));
  await act(async () => { finishB(); await second; });
  await waitFor(() => expect(result.current.pending).toEqual([]));
  expect(invalidate).toHaveBeenCalledTimes(1);
  unmount();
  client.clear();
});
