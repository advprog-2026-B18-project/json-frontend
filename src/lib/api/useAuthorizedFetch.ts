'use client';

import { useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { refreshToken } from '@/services/auth.service';
import { isApiError } from '@/services/api-client';
import { authRequest, inventoryRequest, orderRequest, paymentRequest } from '@/services/api-client';

export type AuthorizedService = 'auth' | 'inventory' | 'orders' | 'payment';

type ServiceRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

export function useAuthorizedFetch() {
  const { accessToken, setAccessToken, clearAuth } = useAuth();
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
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

  const authorizedFetch = useCallback(
    async <T,>(
      service: AuthorizedService,
      path: string,
      options: ServiceRequestOptions = {}
    ): Promise<T> => {
      const doRequest = (token: string | null) => {
        const requestFn = {
          auth: authRequest,
          inventory: inventoryRequest,
          orders: orderRequest,
          payment: paymentRequest,
        }[service] as typeof authRequest;

        return requestFn<T>(path, { ...options, token: token ?? undefined });
      };

      try {
        return await doRequest(accessToken);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          const nextToken = await refreshAccessToken();
          if (!nextToken) throw error;
          return doRequest(nextToken);
        }
        throw error;
      }
    },
    [accessToken, refreshAccessToken]
  );

  return { authorizedFetch, accessToken };
}
