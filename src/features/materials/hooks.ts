import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MaterialType } from '@/shared/api';
import { materialsApi } from './api/materialsApi';

export const materialKeys = {
  list: (projectId: string) => ['materials', projectId] as const,
};

export function useMaterials(projectId: string | undefined) {
  return useQuery({
    queryKey: materialKeys.list(projectId ?? ''),
    queryFn: () => materialsApi.list(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useUploadMaterial(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { file: File; materialType: MaterialType; onProgress?: (pct: number) => void }) =>
      materialsApi.uploadFile(projectId, args.file, args.materialType, args.onProgress),
    onSuccess: () => qc.invalidateQueries({ queryKey: materialKeys.list(projectId) }),
  });
}

export function useAddLink(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceUrl: string) => materialsApi.addLink(projectId, sourceUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: materialKeys.list(projectId) }),
  });
}

export function useDeleteMaterial(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => materialsApi.delete(projectId, materialId),
    onSuccess: () => qc.invalidateQueries({ queryKey: materialKeys.list(projectId) }),
  });
}
