import { apiFetch } from '../client';

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
