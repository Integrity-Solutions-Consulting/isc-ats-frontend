'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationsApi';
import type { Notification } from '../types';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useNotifications(): UseQueryResult<Notification[]> {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: listNotifications,
    // Poll every 60s so notifications appear without a manual reload. React Query
    // pauses polling while the tab is hidden, so this doesn't waste requests.
    refetchInterval: 60_000,
    // Newest first. createdAt is an ISO-8601 string, so a lexicographic
    // descending sort matches chronological order.
    select: (data) => [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useMarkNotificationRead(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      queryClient.setQueryData<Notification[]>(notificationKeys.list(), (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

export function useMarkAllNotificationsRead(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      queryClient.setQueryData<Notification[]>(notificationKeys.list(), (prev) =>
        prev?.map((n) => ({ ...n, read: true })),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}
