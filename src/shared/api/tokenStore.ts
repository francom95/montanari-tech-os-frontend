/**
 * JWT token storage. V1: persisted in localStorage so a refresh survives reloads.
 * Access + refresh are managed here and nowhere else; the axios interceptors are the
 * only readers/writers besides the auth feature.
 */

const ACCESS_KEY = 'mos.accessToken';
const REFRESH_KEY = 'mos.refreshToken';

type Listener = () => void;
const listeners = new Set<Listener>();

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    listeners.forEach((l) => l());
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    listeners.forEach((l) => l());
  },
  hasSession(): boolean {
    return Boolean(localStorage.getItem(REFRESH_KEY));
  },
  /** Subscribe to token changes (e.g. to reset the auth context on logout). */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
