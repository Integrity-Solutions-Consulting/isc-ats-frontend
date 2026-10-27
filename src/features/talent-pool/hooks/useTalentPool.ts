"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listTalentPool, removeFromTalentPool } from "../api/talentPoolApi";
import type { TalentPoolFilters } from "../types";

const KEYS = {
  all: ["talent-pool"] as const,
  list: (filters?: Partial<TalentPoolFilters>) =>
    ["talent-pool", "list", filters] as const,
};

export function useTalentPool(filters?: Partial<TalentPoolFilters>) {
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => listTalentPool(filters),
  });
}

export function useRemoveFromTalentPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeFromTalentPool,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
    onError: (error: Error) => {
      console.error("[useRemoveFromTalentPool]", error);
    },
  });
}
