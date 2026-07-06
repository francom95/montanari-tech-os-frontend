import { http } from '@/shared/api';
import type {
  LoginRequest,
  TokenPairResponse,
  UserResponse,
  RegisterUserRequest,
  LogoutRequest,
} from '@/shared/api';

export const authApi = {
  login: (body: LoginRequest) => http.post<TokenPairResponse>('/api/auth/login', body),
  me: () => http.get<UserResponse>('/api/auth/me'),
  register: (body: RegisterUserRequest) => http.post<UserResponse>('/api/auth/register', body),
  logout: (body: LogoutRequest) => http.post<void>('/api/auth/logout', body),
};
