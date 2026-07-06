import { http } from '@/shared/api';
import type { ModelPolicyResponse, UpdateModelPolicyRequest } from '@/shared/api';

export const modelPoliciesApi = {
  get: () => http.get<ModelPolicyResponse>('/api/internal/model-policies'),
  update: (body: UpdateModelPolicyRequest) =>
    http.put<ModelPolicyResponse>('/api/internal/model-policies', body),
};
