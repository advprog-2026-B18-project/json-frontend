'use client';

import { useCallback, useRef } from 'react';

import type { ApiService } from './client';
import { apiFetchFrom, isApiError } from './client';
import { refreshToken } from './auth';
import { useAuth } from '@/lib/auth/AuthProvider';

export function useAuthorizedFetch() {
  const { accessToken, setAccessToken, clearAuth } = useAuth();
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshInFlight.current) {
      refreshInFlight.current = (async () => {
        try {
          const data = await refreshToken();
          setAccessToken(data.access_token);
          return data.access_token;
        } catch {
          clearAuth();
          return null;
        } finally {
          refreshInFlight.current = null;
        }
      })();
    }

    return refreshInFlight.current;
  }, [clearAuth, setAccessToken]);

  const authorizedFetchFrom = useCallback(
    async <T,>(service: ApiService, endpoint: string, options?: RequestInit): Promise<T> => {
      const doRequest = (token: string | null) => {
        const headers: HeadersInit = {
          ...(options?.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        return apiFetchFrom<T>(service, endpoint, {
          ...options,
          headers,
        });
      };

      try {
        return await doRequest(accessToken);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          const nextToken = await refreshAccessToken();
          if (!nextToken) {
            throw error;
          }
          return doRequest(nextToken);
        }

        throw error;
      }
    },
    [accessToken, refreshAccessToken]
  );

  return { authorizedFetchFrom, accessToken };
}
