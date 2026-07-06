import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { tokenStore } from '@/shared/api';
import type { UserResponse, UserRole } from '@/shared/api';
import { authApi } from './api/authApi';

interface AuthState {
  user: UserResponse | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (accessToken: string, refreshToken: string) => Promise<UserResponse>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  isInternal: boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

const INTERNAL_ROLES: UserRole[] = ['MT_REVIEWER', 'MT_ADMIN', 'SYSTEM_ADMIN'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');

  // Bootstrap: if a refresh token exists, resolve the current user.
  useEffect(() => {
    let cancelled = false;
    if (!tokenStore.hasSession()) {
      setStatus('anonymous');
      return;
    }
    authApi
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        tokenStore.clear();
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to a forced logout from the API layer (refresh failure).
  useEffect(
    () =>
      tokenStore.subscribe(() => {
        if (!tokenStore.hasSession()) {
          setUser(null);
          setStatus('anonymous');
        }
      }),
    [],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      status,
      isInternal: user ? INTERNAL_ROLES.includes(user.role) : false,
      hasRole: (...roles) => (user ? roles.includes(user.role) : false),
      login: async (accessToken, refreshToken) => {
        tokenStore.set(accessToken, refreshToken);
        const u = await authApi.me();
        setUser(u);
        setStatus('authenticated');
        return u;
      },
      logout: async () => {
        const refreshToken = tokenStore.getRefresh();
        if (refreshToken) {
          await authApi.logout({ refreshToken, allDevices: false }).catch(() => undefined);
        }
        tokenStore.clear();
        setUser(null);
        setStatus('anonymous');
      },
    }),
    [user, status],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
