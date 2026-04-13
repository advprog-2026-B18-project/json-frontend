import { apiFetch } from '../client';

export type AdminUserStatusFilter = 'ACTIVE' | 'BANNED' | 'PENDING_VERIFICATION';

export type AdminUserRoleFilter = 'TITIPERS' | 'JASTIPER' | 'ADMIN';

export type AdminUserSortBy = 'created_at' | 'username';

export type AdminUserSortOrder = 'asc' | 'desc';

export type AdminUserListItem = {
  user_id: string | number;
  email: string;
  username: string;
  full_name: string;
  role: AdminUserRoleFilter;
  status: AdminUserStatusFilter;
  created_at: string;
};

export type AdminUserListPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type AdminUserListResponse = {
  data: AdminUserListItem[];
  pagination: AdminUserListPagination;
};

export type AdminUserAccessDeniedResponse = {
  message?: string;
};

export type AdminUserKycInfo = {
  kyc_id?: string | number;
  status?: string;
  submitted_at?: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
};

export type AdminUserTransactionStats = {
  total_orders?: number;
  successful_orders?: number;
  canceled_orders?: number;
  total_spent?: number;
  total_earned?: number;
  success_rate?: number;
  avg_rating?: number;
};

export type AdminUserDetailResponse = {
  user_id: string | number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  status: string;
  phone_number: string | null;
  profile_picture_url: string | null;
  created_at: string;
  kyc_info?: AdminUserKycInfo | null;
  transaction_stats?: AdminUserTransactionStats | null;
};

export type AdminUserNotFoundResponse = {
  message?: string;
};

export type AdminUserStatusAction = 'BAN' | 'UNBAN' | 'DEMOTE_TO_TITIPERS';

export type AdminUserStatusUpdateInput = {
  action: AdminUserStatusAction;
  reason: string;
};

export type AdminUserStatusUpdateResponse = {
  user_id: string | number;
  username: string;
  role: string;
  status: string;
  updated_at: string;
  action_by: string | number;
};

export type AdminUserStatusBadRequestResponse = {
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

export type AdminUserStatusForbiddenResponse = {
  message?: string;
};

export async function getAdminUsers(
  accessToken: string,
  params?: {
    status?: AdminUserStatusFilter;
    role?: AdminUserRoleFilter;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: AdminUserSortBy;
    order?: AdminUserSortOrder;
  }
): Promise<AdminUserListResponse> {
  const query = new URLSearchParams();

  if (params?.status) {
    query.set('status', params.status);
  }

  if (params?.role) {
    query.set('role', params.role);
  }

  if (params?.search) {
    query.set('search', params.search);
  }

  if (params?.page !== undefined) {
    query.set('page', String(params.page));
  }

  if (params?.limit !== undefined) {
    query.set('limit', String(params.limit));
  }

  if (params?.sort_by) {
    query.set('sort_by', params.sort_by);
  }

  if (params?.order) {
    query.set('order', params.order);
  }

  const queryString = query.toString();

  return apiFetch<AdminUserListResponse>(`/admin/users${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAdminUserDetail(
  accessToken: string,
  userId: string | number
): Promise<AdminUserDetailResponse> {
  return apiFetch<AdminUserDetailResponse>(`/admin/users/${encodeURIComponent(String(userId))}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateAdminUserStatus(
  accessToken: string,
  userId: string | number,
  input: AdminUserStatusUpdateInput
): Promise<AdminUserStatusUpdateResponse> {
  return apiFetch<AdminUserStatusUpdateResponse>(`/admin/users/${encodeURIComponent(String(userId))}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}
