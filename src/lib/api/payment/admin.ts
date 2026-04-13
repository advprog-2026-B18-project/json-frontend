import { paymentFetch } from '../client';
import type {
  WalletTransactionDirection,
  WalletTransactionStatus,
  WalletTransactionType,
} from './wallet';

export type GetAdminWalletByUserIdSuccessResponse = {
  wallet_id: string | number;
  user_id: string | number;
  username: string;
  balance: number;
  escrow_balance: number;
  currency: string;
  total_topup_lifetime: number;
  total_withdrawal_lifetime: number;
  created_at: string;
  updated_at: string;
};

export type GetAdminWalletByUserIdNotFoundResponse = {
  message?: string;
};

export type GetAdminWalletTransactionsParams = {
  user_id?: string;
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  page?: number;
  limit?: number;
};

export type AdminWalletTransactionUser = {
  user_id: string | number;
  username: string;
  role: string;
};

export type AdminWalletTransactionItem = {
  transaction_id: string | number;
  type: WalletTransactionType;
  amount: number;
  direction: WalletTransactionDirection;
  status: WalletTransactionStatus;
  user: AdminWalletTransactionUser;
  description: string;
  reference_id: string | number | null;
  created_at: string;
};

export type AdminWalletTransactionsPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type AdminWalletTransactionsSummary = {
  total_topup: number;
  total_withdrawal: number;
  total_payment: number;
  total_refund: number;
  total_earning: number;
  platform_escrow_balance: number;
};

export type GetAdminWalletTransactionsSuccessResponse = {
  data: AdminWalletTransactionItem[];
  pagination: AdminWalletTransactionsPagination;
  summary: AdminWalletTransactionsSummary;
};

export type GetAdminWalletTransactionsForbiddenResponse = {
  message?: string;
};

export type ManualAdjustmentDirection = 'CREDIT' | 'DEBIT';

export type CreateManualWalletAdjustmentInput = {
  direction: ManualAdjustmentDirection;
  amount: number;
  reason: string;
  reference_id?: string;
};

export type CreateManualWalletAdjustmentSuccessResponse = {
  transaction_id: string | number;
  type: 'ADJUSTMENT';
  user_id: string | number;
  direction: ManualAdjustmentDirection;
  amount: number;
  new_balance: number;
  reason: string;
  adjusted_by: string | number;
  created_at: string;
};

export type CreateManualWalletAdjustmentBadRequestResponse = {
  errors?: Array<{
    field: 'direction' | 'amount' | 'reason' | 'reference_id';
    message: string;
  }>;
};

export type CreateManualWalletAdjustmentUnprocessableResponse = {
  message?: 'Adjustment would result in negative balance' | string;
  current_balance?: number;
  debit_amount?: number;
};

export async function getAdminWalletByUserId(
  accessToken: string,
  userId: string
): Promise<GetAdminWalletByUserIdSuccessResponse> {
  return paymentFetch<GetAdminWalletByUserIdSuccessResponse>(
    `/admin/wallets/${encodeURIComponent(userId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

export async function getAdminWalletTransactions(
  accessToken: string,
  params?: GetAdminWalletTransactionsParams
): Promise<GetAdminWalletTransactionsSuccessResponse> {
  const query = new URLSearchParams();

  if (params?.user_id) {
    query.set('user_id', params.user_id);
  }

  if (params?.type) {
    query.set('type', params.type);
  }

  if (params?.status) {
    query.set('status', params.status);
  }

  if (params?.date_from) {
    query.set('date_from', params.date_from);
  }

  if (params?.date_to) {
    query.set('date_to', params.date_to);
  }

  if (params?.min_amount !== undefined) {
    query.set('min_amount', String(params.min_amount));
  }

  if (params?.page !== undefined) {
    query.set('page', String(params.page));
  }

  if (params?.limit !== undefined) {
    query.set('limit', String(params.limit));
  }

  const queryString = query.toString();

  return paymentFetch<GetAdminWalletTransactionsSuccessResponse>(
    `/admin/wallets/transactions${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

export async function createManualWalletAdjustment(
  accessToken: string,
  userId: string,
  input: CreateManualWalletAdjustmentInput
): Promise<CreateManualWalletAdjustmentSuccessResponse> {
  if (input.amount <= 0) {
    throw new Error('amount harus bernilai positif.');
  }

  if (!input.reason.trim()) {
    throw new Error('reason wajib diisi.');
  }

  if (input.reason.length > 500) {
    throw new Error('reason maksimal 500 karakter.');
  }

  return paymentFetch<CreateManualWalletAdjustmentSuccessResponse>(
    `/admin/wallets/${encodeURIComponent(userId)}/adjust`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    }
  );
}
