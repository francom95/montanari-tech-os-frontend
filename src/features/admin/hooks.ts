import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateModelPolicyRequest, UpdateStageTemplateRequest } from '@/shared/api';
import { stageTemplatesApi } from './api/stageTemplatesApi';
import { modelPoliciesApi } from './api/modelPoliciesApi';
import { internalUsersApi } from './api/internalUsersApi';

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

export const internalUserKeys = {
  organizations: () => ['internal-organizations'] as const,
  users: (organizationId: string) => ['internal-users', organizationId] as const,
};

export function useInternalOrganizations() {
  return useQuery({
    queryKey: internalUserKeys.organizations(),
    queryFn: internalUsersApi.listOrganizations,
  });
}

export function useInternalUsers(organizationId: string | undefined) {
  return useQuery({
    queryKey: internalUserKeys.users(organizationId ?? ''),
    queryFn: () => internalUsersApi.listUsers(organizationId!),
    enabled: Boolean(organizationId),
  });
}

export function useToggleManualExecution(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      internalUsersApi.setManualExecution(userId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internalUserKeys.users(organizationId) });
    },
  });
}
