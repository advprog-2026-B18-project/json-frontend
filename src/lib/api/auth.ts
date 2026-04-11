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

export type PublicProfileBaseResponse = {
  user_id: string | number;
  username: string;
  full_name: string;
  profile_picture_url: string | null;
  member_since: string;
};

export type PublicTitipersProfileResponse = PublicProfileBaseResponse & {
  role: 'TITIPERS';
  status: string;
};

export type PublicJastiperProfileResponse = PublicProfileBaseResponse & {
  role: 'JASTIPER';
  stats: {
    total_orders: number;
    success_rate: number;
    avg_rating: number;
  };
  rating: number;
  badges: string[];
};

export type PublicProfileNotFoundResponse = {
  message?: string;
};

export type KycSocialMediaLink = {
  platform: string;
  url: string;
};

export type SubmitKycInput = {
  full_name_ktp: string;
  ktp_number: string;
  ktp_photo_url: string;
  selfie_with_ktp_url: string;
  social_media_links: KycSocialMediaLink[];
  bio?: string;
};

export type SubmitKycSuccessResponse = {
  kyc_id: string | number;
  status: 'PENDING_VERIFICATION';
  submitted_at: string;
};

export type SubmitKycErrorResponse = {
  message?: string;
};

export type SubmitKycValidationErrorResponse = {
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export type GetMyKycStatusSuccessResponse = {
  kyc_id: string | number;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

export type GetMyKycStatusNotFoundResponse = {
  message?: string;
};

export type AdminKycStatusFilter = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export type AdminKycListItem = {
  kyc_id: string | number;
  user_id: string | number;
  username: string;
  full_name_ktp: string;
  status: AdminKycStatusFilter;
  submitted_at: string;
};

export type AdminKycListPagination = {
  page: number;
  limit: number;
  total: number;
};

export type AdminKycListResponse = {
  data: AdminKycListItem[];
  pagination: AdminKycListPagination;
};

export type AdminKycAccessDeniedResponse = {
  message?: string;
};

export type AdminKycUserSummary = {
  user_id: string | number;
  email: string;
  username: string;
};

export type AdminKycDetailResponse = {
  kyc_id: string | number;
  user: AdminKycUserSummary;
  full_name_ktp: string;
  ktp_number: string;
  ktp_photo_url: string;
  selfie_with_ktp_url: string;
  social_media_links: KycSocialMediaLink[];
  bio: string | null;
  status: AdminKycStatusFilter;
  submitted_at: string;
};

export type AdminKycNotFoundResponse = {
  message?: string;
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

export async function getPublicProfile(
  username: string,
  accessToken?: string
): Promise<PublicTitipersProfileResponse | PublicJastiperProfileResponse> {
  return apiFetch<PublicTitipersProfileResponse | PublicJastiperProfileResponse>(`/profile/${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

export async function submitKyc(
  accessToken: string,
  input: SubmitKycInput
): Promise<SubmitKycSuccessResponse> {
  return apiFetch<SubmitKycSuccessResponse>('/profile/me/kyc', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export async function getMyKycStatus(accessToken: string): Promise<GetMyKycStatusSuccessResponse> {
  return apiFetch<GetMyKycStatusSuccessResponse>('/profile/me/kyc', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAdminKycList(
  accessToken: string,
  params?: {
    status?: AdminKycStatusFilter;
    page?: number;
    limit?: number;
  }
): Promise<AdminKycListResponse> {
  const query = new URLSearchParams();

  if (params?.status) {
    query.set('status', params.status);
  }

  if (params?.page !== undefined) {
    query.set('page', String(params.page));
  }

  if (params?.limit !== undefined) {
    query.set('limit', String(params.limit));
  }

  const queryString = query.toString();

  return apiFetch<AdminKycListResponse>(`/admin/kyc${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAdminKycDetail(
  accessToken: string,
  kycId: string | number
): Promise<AdminKycDetailResponse> {
  return apiFetch<AdminKycDetailResponse>(`/admin/kyc/${encodeURIComponent(String(kycId))}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
