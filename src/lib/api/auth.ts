import { apiFetch } from './client';

export type LoginSuccessResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  user: {
    user_id: string | number;
    email: string;
    role: string;
    username: string;
    status: string;
  };
};

export type LoginErrorResponse = {
  message?: string;
};

export type RegisterRole = 'JASTIPER' | 'TITIPERS';

export type RegisterSuccessResponse = {
  user_id: string | number;
  email: string;
  role: RegisterRole;
  created_at: string;
};

export type RegisterErrorListResponse = {
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export type RegisterMessageResponse = {
  message?: string;
};

export type RefreshTokenSuccessResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type RefreshTokenErrorResponse = {
  message?: string;
};

export type LogoutSuccessResponse = {
  message: string;
};

export type LogoutErrorResponse = {
  message?: string;
};

export async function login(email: string, password: string): Promise<LoginSuccessResponse> {
  return apiFetch<LoginSuccessResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(input: {
  email: string;
  password: string;
  password_confirmation: string;
  role: RegisterRole;
}): Promise<RegisterSuccessResponse> {
  return apiFetch<RegisterSuccessResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function refreshToken(refresh_token: string): Promise<RefreshTokenSuccessResponse> {
  return apiFetch<RefreshTokenSuccessResponse>('/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export async function logout(input: {
  accessToken: string;
  refresh_token: string;
}): Promise<LogoutSuccessResponse> {
  return apiFetch<LogoutSuccessResponse>('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({ refresh_token: input.refresh_token }),
  });
}

export function setRefreshTokenCookie(refreshToken: string) {
  const encoded = encodeURIComponent(refreshToken);
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `refresh_token=${encoded}; path=/; SameSite=Lax${secure}`;
}
