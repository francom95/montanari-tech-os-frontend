import { http } from '@/shared/api';
import type { UserResponse, UserRole, UserStatus } from '@/shared/api';

export const usersApi = {
  /** Every user in the caller's own organization — see UserController Javadoc for scoping. */
  list: () => http.get<UserResponse[]>('/api/users'),
  updateRole: (userId: string, role: UserRole) =>
    http.patch<UserResponse>(`/api/users/${userId}/role`, { role }),
  updateStatus: (userId: string, status: UserStatus) =>
    http.patch<UserResponse>(`/api/users/${userId}/status`, { status }),
};
