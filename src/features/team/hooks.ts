import { useQuery, useQueryClient } from '@tanstack/react-query';
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
