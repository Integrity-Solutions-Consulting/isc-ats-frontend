import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissionCatalog,
  getRoleParameterTypes,
  setRoleParameterTypes,
} from '../api/rolesApi';

export const roleKeys = {
  all: ['roles'] as const,
  catalog: ['permission-catalog'] as const,
  parameterTypes: (roleId: string) => ['role-parameter-types', roleId] as const,
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

/** Loads the currently-selected role's writable catalog-parameter-types.
 *  Disabled when no role is selected — pass `null` in that case. */
export function useRoleParameterTypes(roleId: string | null) {
  return useQuery({
    queryKey: roleKeys.parameterTypes(roleId ?? ''),
    queryFn: () => getRoleParameterTypes(roleId!),
    enabled: !!roleId,
  });
}

export function useSetRoleParameterTypes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, types }: { id: string; types: string[] }) => setRoleParameterTypes(id, types),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.parameterTypes(variables.id) });
    },
  });
}
