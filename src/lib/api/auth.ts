import { apiFetch, appFetch } from './client';

export type LoginSuccessResponse = {
  access_token: string;
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

export type MeProfileSuccessResponse = {
  user_id: string | number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  status: string;
  profile_picture_url: string | null;
  phone_number: string | null;
  created_at: string;
  kyc_status?: string;
};

export type MeProfileErrorResponse = {
  message?: string;
};

export type UpdateMyProfileInput = {
  username?: string;
  full_name: string;
  phone_number?: string;
  profile_picture_url?: string;
};

export type UpdateMyProfileSuccessResponse = {
  user_id: string | number;
  username: string;
  full_name: string;
  phone_number: string | null;
  profile_picture_url: string | null;
  updated_at: string;
};

export type UpdateMyProfileConflictResponse = {
  message?: string;
};

export type UpdateMyProfileValidationErrorResponse = {
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export async function login(email: string, password: string): Promise<LoginSuccessResponse> {
  // Uses Next.js BFF route handler; refresh_token is stored as HttpOnly cookie.
  return appFetch<LoginSuccessResponse>('/api/auth/login', {
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

export async function refreshToken(): Promise<RefreshTokenSuccessResponse> {
  // Uses Next.js BFF route handler; refresh_token is read from HttpOnly cookie.
  return appFetch<RefreshTokenSuccessResponse>('/api/auth/refresh-token', {
    method: 'POST',
  });
}

export async function logout(accessToken: string): Promise<LogoutSuccessResponse> {
  // Uses Next.js BFF route handler; refresh_token is read from HttpOnly cookie.
  return appFetch<LogoutSuccessResponse>('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getMyProfile(accessToken: string): Promise<MeProfileSuccessResponse> {
  return apiFetch<MeProfileSuccessResponse>('/profile/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateMyProfile(
  accessToken: string,
  input: UpdateMyProfileInput
): Promise<UpdateMyProfileSuccessResponse> {
  return apiFetch<UpdateMyProfileSuccessResponse>('/profile/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}
