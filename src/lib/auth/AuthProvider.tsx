'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AccountResponse } from '@/services/auth.service';
import { getMyProfile } from '@/services/auth.service';

type AuthContextValue = {
  accessToken: string | null;
  user: AccountResponse | null;
  isLoading: boolean;
  setAccessToken: (token: string, user?: AccountResponse) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AccountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAccessToken = useCallback(
      (token: string, newUser?: AccountResponse) => {
        setAccessTokenState(token);
        if (newUser) setUser(newUser);
      },
      []
  );

  const clearAuth = useCallback(() => {
    setAccessTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function tryRestoreSession() {
      try {
        const res = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return;

        const body = await res.json().catch(() => null) as {
          access_token?: string;
          expires_in?: number;
        } | null;

        if (!cancelled && body?.access_token) {
          const token = body.access_token;
          setAccessTokenState(token);

          try {
            const profileData = await getMyProfile(token);
            if (!cancelled) {
              setUser({
                user_id: profileData.user_id,
                email: profileData.email,
                role: profileData.role,
                username: profileData.username,
                status: profileData.status,
              });
            }
          } catch (profileError) {
            if (!cancelled) clearAuth();
          }
        }
      } catch {
        // Network error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    tryRestoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
      () => ({ accessToken, user, isLoading, setAccessToken, clearAuth }),
      [accessToken, user, isLoading, setAccessToken, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}