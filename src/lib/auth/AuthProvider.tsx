'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type AuthContextValue = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(() => {
    return {
      accessToken,
      setAccessToken: (token) => setAccessTokenState(token),
      clearAuth: () => setAccessTokenState(null),
    };
  }, [accessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
