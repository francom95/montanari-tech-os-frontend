import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateStageDocumentContentRequest, RequestHumanReviewRequest } from '@/shared/api';
import { stagesApi } from './api/stagesApi';

export const stageKeys = {
  all: (projectId: string) => ['stages', projectId] as const,
  list: (projectId: string) => [...stageKeys.all(projectId), 'list'] as const,
  detail: (projectId: string, stageKey: string) =>
    [...stageKeys.all(projectId), 'detail', stageKey] as const,
};

export function useStages(projectId: string | undefined) {
  return useQuery({
    queryKey: stageKeys.list(projectId ?? ''),
    queryFn: () => stagesApi.list(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useStage(projectId: string | undefined, stageKey: string | undefined) {
  return useQuery({
    queryKey: stageKeys.detail(projectId ?? '', stageKey ?? ''),
    queryFn: () => stagesApi.get(projectId!, stageKey!),
    enabled: Boolean(projectId && stageKey),
  });
}

export function useUpdateStageContent(projectId: string, stageKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStageDocumentContentRequest) =>
      stagesApi.updateContent(projectId, stageKey, body),
    onSuccess: (updated) => {
      qc.setQueryData(stageKeys.detail(projectId, stageKey), updated);
      qc.invalidateQueries({ queryKey: stageKeys.list(projectId) });
    },
  });
}

export function useRequestReview(projectId: string, stageKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RequestHumanReviewRequest) =>
      stagesApi.requestReview(projectId, stageKey, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stageKeys.all(projectId) });
    },
  });
}
