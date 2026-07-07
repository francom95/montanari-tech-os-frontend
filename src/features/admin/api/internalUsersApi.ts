import { http } from '@/shared/api';
import type { OrganizationResponse, UserResponse } from '@/shared/api';

export const internalUsersApi = {
  listOrganizations: () => http.get<OrganizationResponse[]>('/api/internal/organizations'),
  listUsers: (organizationId: string) =>
    http.get<UserResponse[]>(`/api/internal/users?organizationId=${organizationId}`),
  setManualExecution: (userId: string, enabled: boolean) =>
    http.patch<UserResponse>(`/api/internal/users/${userId}/manual-execution`, { enabled }),
};
