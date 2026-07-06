import { http } from '@/shared/api';
import type { UserResponse } from '@/shared/api';

export const usersApi = {
  /** Every user in the caller's own organization — see UserController Javadoc for scoping. */
  list: () => http.get<UserResponse[]>('/api/users'),
};
