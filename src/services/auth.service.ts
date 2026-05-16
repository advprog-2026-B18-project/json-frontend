/**
 * Auth Service
 * Base URL: NEXT_PUBLIC_AUTH_SERVICE_URL (Spring Boot, :8082)
 * Error shape: { success, message, data, errors } envelope
 *
 * BFF routes (/api/auth/*) are used for login/logout/refresh so the
 * refresh_token HttpOnly cookie is managed server-side.
 *
 * Contracts: .kiro/steering/backend-contracts-auth-service.md
 */

import { authRequest, ApiError, isApiError } from './api-client';

export { ApiError, isApiError };

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type UserRole = 'TITIPERS' | 'JASTIPER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'BANNED' | 'PENDING_VERIFICATION';
export type KycStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export type AccountResponse = {
  user_id: string;
  email: string;
  role: UserRole;
  username: string | null;
  status: AccountStatus;
};

export type ProfileResponse = {
  user_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  status: AccountStatus;
  profile_picture_url: string | null;
  phone_number: string | null;
  created_at: string;
  kyc_status: KycStatus | null;
};

// ---------------------------------------------------------------------------
// login
// POST /api/auth/login  (BFF — sets refresh_token HttpOnly cookie)
// Public
// NOTE: The auth service returns the access token in a field named
//       `refresh_token` — this is a backend naming quirk, do not rename it.
// ---------------------------------------------------------------------------

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  /** Access token — named refresh_token by the backend (cannot be changed) */
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  user: AccountResponse;
};

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (body as { message?: string } | null)?.message ?? `Login gagal (HTTP ${res.status}).`;
    throw new ApiError(res.status, message);
  }

  return body as LoginResponse;
}

// ---------------------------------------------------------------------------
// register
// POST /auth/register  (direct to auth service — no BFF needed)
// Public
// ---------------------------------------------------------------------------

export type RegisterInput = {
  email: string;
  password: string;
  password_confirmation: string;
  /** Only TITIPERS or JASTIPER — ADMIN is rejected by the backend */
  role: 'TITIPERS' | 'JASTIPER';
};

export type RegisterResponse = {
  user_id: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  return authRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

// ---------------------------------------------------------------------------
// refreshToken
// POST /api/auth/refresh-token  (BFF — reads refresh_token cookie)
// Public
// ---------------------------------------------------------------------------

export type RefreshTokenResponse = {
  access_token: string;
  expires_in: number;
};

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const res = await fetch('/api/auth/refresh-token', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (body as { message?: string } | null)?.message ?? `Token refresh gagal (HTTP ${res.status}).`;
    throw new ApiError(res.status, message);
  }

  return body as RefreshTokenResponse;
}

// ---------------------------------------------------------------------------
// logout
// POST /api/auth/logout  (BFF — clears refresh_token cookie)
// Protected — JWT required
// ---------------------------------------------------------------------------

export async function logout(token: string): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = (body as { message?: string } | null)?.message ?? `Logout gagal (HTTP ${res.status}).`;
    throw new ApiError(res.status, message);
  }
}

// ---------------------------------------------------------------------------
// getMe
// GET /profile/me
// Protected — JWT required
// ---------------------------------------------------------------------------

export async function getMe(token: string): Promise<ProfileResponse> {
  return authRequest<ProfileResponse>('/profile/me', {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// updateProfile
// PATCH /profile/me
// Protected — JWT required
// ---------------------------------------------------------------------------

export type UpdateProfileInput = {
  username?: string;
  full_name?: string;
  phone_number?: string;
  profile_picture_url?: string;
};

export async function updateProfile(
  token: string,
  input: UpdateProfileInput
): Promise<ProfileResponse> {
  return authRequest<ProfileResponse>('/profile/me', {
    method: 'PATCH',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// getPublicProfile
// GET /profile/:username
// Public — no token required
// NOTE: stats, rating, badges are only present for JASTIPER accounts
// ---------------------------------------------------------------------------

export type PublicProfileStats = {
  total_orders: number;
  success_rate: number;
  avg_rating: number;
};

export type PublicProfileResponse = {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_picture_url: string | null;
  role: UserRole;
  member_since: string;
  status: AccountStatus;
  // Only present for JASTIPER (omitted entirely for TITIPERS)
  stats?: PublicProfileStats;
  rating?: number;
  badges?: string[];
};

export async function getPublicProfile(username: string): Promise<PublicProfileResponse> {
  return authRequest<PublicProfileResponse>(`/profile/${encodeURIComponent(username)}`, {
    method: 'GET',
  });
}

// ---------------------------------------------------------------------------
// submitKyc
// POST /profile/me/kyc
// Protected — TITIPERS role only
// ---------------------------------------------------------------------------

export type KycSocialMediaLink = {
  platform: string;
  url: string;
};

export type SubmitKycInput = {
  full_name_ktp: string;
  ktp_number: string; // exactly 16 digits
  ktp_photo_url: string;
  selfie_with_ktp_url: string;
  social_media_links: KycSocialMediaLink[];
  bio?: string;
};

export async function submitKyc(token: string, input: SubmitKycInput): Promise<ProfileResponse> {
  return authRequest<ProfileResponse>('/profile/me/kyc', {
    method: 'POST',
    token,
    body: input,
  });
}

// ---------------------------------------------------------------------------
// getMyKycStatus
// GET /profile/me/kyc
// Protected — any authenticated user
// ---------------------------------------------------------------------------

export type KycStatusResponse = {
  kyc_id: string;
  status: KycStatus;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

export async function getMyKycStatus(token: string): Promise<KycStatusResponse> {
  return authRequest<KycStatusResponse>('/profile/me/kyc', {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// Admin — getAdminUsers
// GET /admin/users
// Protected — ADMIN role only
// ---------------------------------------------------------------------------

export type AdminUserListItem = {
  user_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
};

export type AdminUserListParams = {
  status?: AccountStatus;
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
};

export type AdminUserListResponse = {
  data: AdminUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export async function getAdminUsers(
  token: string,
  params?: AdminUserListParams
): Promise<AdminUserListResponse> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return authRequest<AdminUserListResponse>(`/admin/users${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// Admin — getAdminUserDetail
// GET /admin/users/:userId
// Protected — ADMIN role only
// ---------------------------------------------------------------------------

export type AdminUserDetailStats = {
  totalOrders?: number;
  completedOrders?: number;
  successRate?: number;
  avgRating?: number;
  totalReviews?: number;
};

export type AdminUserDetailResponse = {
  user_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  status: AccountStatus;
  profile_picture_url: string | null;
  phone_number: string | null;
  created_at: string;
  kyc_id?: string | null;
  kyc_status?: KycStatus | null;
  kyc_submitted_at?: string | null;
  kyc_reviewed_at?: string | null;
  kyc_rejection_reason?: string | null;
  stats?: AdminUserDetailStats;
};

export async function getAdminUserDetail(
  token: string,
  userId: string
): Promise<AdminUserDetailResponse> {
  return authRequest<AdminUserDetailResponse>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// Admin — getAdminKycList
// GET /admin/kyc
// Protected — ADMIN role only
// ---------------------------------------------------------------------------

export type AdminKycListItem = {
  kyc_id: string;
  user_id: string;
  username: string | null;
  full_name_ktp: string;
  status: KycStatus;
  submitted_at: string;
};

export type AdminKycListParams = {
  status?: KycStatus;
  page?: number;
  limit?: number;
};

export type AdminKycListResponse = {
  data: AdminKycListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export async function getAdminKycList(
  token: string,
  params?: AdminKycListParams
): Promise<AdminKycListResponse> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return authRequest<AdminKycListResponse>(`/admin/kyc${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

// ---------------------------------------------------------------------------
// Admin — reviewKyc
// PATCH /admin/kyc/:kycId/review
// Protected — ADMIN role only
// NOTE: field name is `rejection-reason` (hyphen, not underscore) — backend quirk
// ---------------------------------------------------------------------------

export type ReviewKycInput =
  | { action: 'APPROVE' }
  | { action: 'REJECT'; 'rejection-reason': string };

export type ReviewKycResponse = {
  kyc_id: string;
  status: KycStatus;
  submitted_at: string;
  reviewed_at: string;
  rejection_reason: string | null;
};

export async function reviewKyc(
  token: string,
  kycId: string,
  input: ReviewKycInput
): Promise<ReviewKycResponse> {
  return authRequest<ReviewKycResponse>(
    `/admin/kyc/${encodeURIComponent(kycId)}/review`,
    { method: 'PATCH', token, body: input }
  );
}
