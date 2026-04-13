import { apiFetch } from '../client';

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
  return apiFetch<PublicTitipersProfileResponse | PublicJastiperProfileResponse>(
    `/profile/${encodeURIComponent(username)}`,
    {
      method: 'GET',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    }
  );
}
