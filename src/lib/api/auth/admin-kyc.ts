import { apiFetch } from '../client';
import type { KycSocialMediaLink } from './kyc';

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

export type ReviewKycAction = 'APPROVE' | 'REJECT';

export type ReviewKycInput = {
  action: ReviewKycAction;
  rejection_reason?: string;
};

export type ReviewKycApproveResponse = {
  kyc_id: string | number;
  status: 'APPROVED';
  user: {
    user_id: string | number;
    role: 'JASTIPER';
  };
  reviewed_at: string;
};

export type ReviewKycRejectResponse = {
  kyc_id: string | number;
  status: 'REJECTED';
  rejection_reason: string;
  reviewed_at: string;
};

export type ReviewKycValidationErrorResponse = {
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export type ReviewKycConflictResponse = {
  message?: string;
};

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

export async function reviewAdminKyc(
  accessToken: string,
  kycId: string | number,
  input: ReviewKycInput
): Promise<ReviewKycApproveResponse | ReviewKycRejectResponse> {
  return apiFetch<ReviewKycApproveResponse | ReviewKycRejectResponse>(
    `/admin/kyc/${encodeURIComponent(String(kycId))}/review`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    }
  );
}
