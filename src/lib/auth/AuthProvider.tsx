'use client';

/**
 * AuthProvider — TASK-116
 *
 * Provides in-memory access token state and user info to the entire app.
 *
 * Security model:
 * - The access token is held in React context (in-memory) only.
 *   It is NEVER written to localStorage, sessionStorage, or any other
 *   browser storage.
 * - The refresh_token is stored as an HttpOnly cookie managed by the BFF.
 *   JavaScript cannot read it directly.
 *
 * Auto-refresh on mount:
 * - On first render, AuthProvider calls POST /api/auth/refresh-token.
 * - If the HttpOnly refresh_token cookie is present and valid, the BFF
 *   returns a new access token which is stored in context — restoring the
 *   session transparently after a page reload.
 * - If the cookie is absent or expired, the call fails silently and the
 *   user remains unauthenticated.
 * - `isLoading` is true until this initial check completes, allowing pages
 *   to avoid flashing unauthenticated UI.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getMyProfile, type AccountResponse } from '@/services/auth.service';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

type AuthContextValue = {
  /** In-memory access token. null when unauthenticated. */
  accessToken: string | null;

  /**
   * Basic user info from the last successful login or token refresh.
   * null when unauthenticated.
   */
  user: AccountResponse | null;

  /**
   * True while the initial auto-refresh check on mount is in progress.
   * Use this to show a loading state instead of flashing unauthenticated UI.
   */
  isLoading: boolean;

  /** Store a new access token (called after login or token refresh). */
  setAccessToken: (token: string, user?: AccountResponse) => void;

  /** Clear auth state (called after logout or when refresh fails). */
  clearAuth: () => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AccountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------------------------
  // setAccessToken — stores token and optionally user info
  // -------------------------------------------------------------------------
  const setAccessToken = useCallback(
    (token: string, newUser?: AccountResponse) => {
      setAccessTokenState(token);
      if (newUser) setUser(newUser);
    },
    []
  );

  // -------------------------------------------------------------------------
  // clearAuth — wipes all auth state (logout / refresh failure)
  // -------------------------------------------------------------------------
  const clearAuth = useCallback(() => {
    setAccessTokenState(null);
    setUser(null);
  }, []);

  // -------------------------------------------------------------------------
  // Shared refresh logic (used by initial restore + periodic refresh)
  // -------------------------------------------------------------------------
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) return null;

      const body = await res.json().catch(() => null) as {
        access_token?: string;
      } | null;

      if (!body?.access_token) return null;

      const newToken = body.access_token;
      setAccessTokenState(newToken);
      return newToken;
    } catch {
      return null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Auto-refresh on mount
  //
  // Attempts to restore the session by calling the BFF refresh-token route.
  // The BFF reads the HttpOnly refresh_token cookie and returns a new access
  // token if the cookie is valid.
  //
  // Runs once on mount. isLoading stays true until the attempt completes
  // (success or failure) so child components don't flash unauthenticated UI.
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function tryRestoreSession() {
      const token = await refreshAccessToken();
      if (!cancelled && token) {
        const profile = await getMyProfile(token).catch(() => null);
        if (!cancelled && profile) {
          setUser({
            user_id: profile.user_id,
            email: profile.email,
            role: profile.role,
            username: profile.username,
            status: profile.status,
          });
        }
      }
      if (!cancelled) setIsLoading(false);
    }

    tryRestoreSession();

    return () => {
      cancelled = true;
    };
  }, [refreshAccessToken]);

  // -------------------------------------------------------------------------
  // Proactive periodic refresh — keeps the in-memory token and HttpOnly
  // cookie fresh before expiry (15 min default) so the refresh endpoint
  // never receives an already-expired token.
  //
  // Runs every 10 minutes when the user has a valid session.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!accessToken) return;

    const intervalId = setInterval(() => {
      refreshAccessToken();
    }, 600_000);

    return () => clearInterval(intervalId);
  }, [accessToken, refreshAccessToken]);

  // -------------------------------------------------------------------------
  // Context value — memoised to avoid unnecessary re-renders
  // -------------------------------------------------------------------------
  const value = useMemo<AuthContextValue>(
    () => ({ accessToken, user, isLoading, setAccessToken, clearAuth }),
    [accessToken, user, isLoading, setAccessToken, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// useAuth hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
