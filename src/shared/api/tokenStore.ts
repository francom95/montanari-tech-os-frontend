/**
 * JWT token storage. V1: persisted in localStorage so a refresh survives reloads.
 * Access + refresh are managed here and nowhere else; the axios interceptors are the
 * only readers/writers besides the auth feature.
 */

const ACCESS_KEY = 'mos.accessToken';
const REFRESH_KEY = 'mos.refreshToken';

type Listener = () => void;
const listeners = new Set<Listener>();

// localStorage can throw (Safari private-mode edge cases, storage-disabled policies, sandboxed
// iframes) — the request interceptor calls getAccess() on every outgoing request, so an unguarded
// throw here would break the entire app, not just auth. Read failures fall back to "no token";
// write failures are swallowed since there's nothing else we can do about a storage that refuses
// writes (the session just won't persist across a reload).
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — storage unavailable
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore — storage unavailable
  }
}

export const tokenStore = {
  getAccess(): string | null {
    return safeGet(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return safeGet(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string): void {
    safeSet(ACCESS_KEY, accessToken);
    safeSet(REFRESH_KEY, refreshToken);
    listeners.forEach((l) => l());
  },
  clear(): void {
    safeRemove(ACCESS_KEY);
    safeRemove(REFRESH_KEY);
    listeners.forEach((l) => l());
  },
  hasSession(): boolean {
    return Boolean(safeGet(REFRESH_KEY));
  },
  /** Subscribe to token changes (e.g. to reset the auth context on logout). */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
