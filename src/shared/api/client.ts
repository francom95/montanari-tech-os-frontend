/**
 * Single Axios instance for the whole app. Features never import axios directly — they go
 * through the typed helpers in `http` (below) or their feature `api/` modules.
 *
 * Responsibilities:
 *  - attach the Bearer access token on every request
 *  - transparently refresh the access token on 401 (single-flight; concurrent 401s share
 *    one refresh call), then retry the original request
 *  - on refresh failure, clear the session and bounce to /login
 *  - reject with a normalized AppError (never a raw AxiosError)
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStore } from './tokenStore';
import { normalizeError } from './apiError';
import type { TokenPairResponse } from './types';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Endpoints that must never trigger the refresh-retry loop.
const AUTH_BYPASS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/register'];

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Single-flight refresh ----
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('no refresh token');

  // Bare axios call (not `api`) so we don't recurse through interceptors.
  const { data } = await axios.post<TokenPairResponse>(
    `${baseURL}/api/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  tokenStore.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

function redirectToLogin(): void {
  tokenStore.clear();
  if (window.location.pathname !== '/login') {
    const from = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/login?from=${from}`);
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isBypass = AUTH_BYPASS.some((p) => url.includes(p));

    if (status === 401 && original && !original._retried && !isBypass && tokenStore.getRefresh()) {
      original._retried = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api.request(original);
      } catch {
        redirectToLogin();
        return Promise.reject(normalizeError(error));
      }
    }

    // A 401 on a request we couldn't refresh means the session is dead.
    if (status === 401 && !isBypass) {
      redirectToLogin();
    }

    return Promise.reject(normalizeError(error));
  },
);

/** Thin typed helpers so feature api/ modules stay terse. All reject with AppError. */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.put<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, body, config).then((r) => r.data),
  del: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((r) => r.data),
};
