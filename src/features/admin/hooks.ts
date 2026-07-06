import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateModelPolicyRequest, UpdateStageTemplateRequest } from '@/shared/api';
import { stageTemplatesApi } from './api/stageTemplatesApi';
import { modelPoliciesApi } from './api/modelPoliciesApi';

export const stageTemplateKeys = {
  list: () => ['stage-templates'] as const,
};

export function useStageTemplates() {
  return useQuery({ queryKey: stageTemplateKeys.list(), queryFn: stageTemplatesApi.list });
}

export function useUpdateStageTemplate(stageKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStageTemplateRequest) => stageTemplatesApi.update(stageKey, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageTemplateKeys.list() });
    },
  });
}

export const modelPolicyKeys = {
  detail: () => ['model-policy'] as const,
};

export function useModelPolicy() {
  return useQuery({ queryKey: modelPolicyKeys.detail(), queryFn: modelPoliciesApi.get });
}

export function useUpdateModelPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateModelPolicyRequest) => modelPoliciesApi.update(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelPolicyKeys.detail() });
    },
  });
}
