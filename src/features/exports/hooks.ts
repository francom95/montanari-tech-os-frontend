import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exportsApi } from './api/exportsApi';

export const exportKeys = {
  list: (projectId: string) => ['exports', projectId] as const,
};

export function useExports(projectId: string | undefined) {
  return useQuery({
    queryKey: exportKeys.list(projectId ?? ''),
    queryFn: () => exportsApi.list(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateExport(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => exportsApi.create(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: exportKeys.list(projectId) }),
  });
}
