import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserRole, UserStatus } from '@/shared/api';
import { usersApi } from './api/usersApi';

export const userKeys = {
  list: ['users'] as const,
};

export function useOrgUsers() {
  return useQuery({
    queryKey: userKeys.list,
    queryFn: usersApi.list,
  });
}

/** Call after a successful invite so the new user shows up without a manual refresh. */
export function useInvalidateUsers() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: userKeys.list });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      usersApi.updateRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list }),
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      usersApi.updateStatus(userId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list }),
  });
}
