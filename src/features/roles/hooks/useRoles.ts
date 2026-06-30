import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissionCatalog,
} from '../api/rolesApi';

export const roleKeys = {
  all: ['roles'] as const,
  catalog: ['permission-catalog'] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: listRoles,
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: roleKeys.catalog,
    queryFn: listPermissionCatalog,
    staleTime: 5 * 60 * 1000, // catalog rarely changes within a session
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; permissionIds?: string[] } }) =>
      updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
