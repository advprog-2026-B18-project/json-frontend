import { paymentFetch } from '../client';
import type { TopUpPaymentMethod } from './topup';

export type GetMyWalletSuccessResponse = {
  wallet_id: string | number;
  user_id: string | number;
  balance: number;
  escrow_balance?: number;
  // Available for JASTIPER (if provided by backend).
  withdrawable_balance?: number;
};

export type GetMyWalletUnauthorizedResponse = {
  message?: string;
};

export type WalletTransactionType =
  | 'TOPUP'
  | 'PAYMENT'
  | 'REFUND'
  | 'EARNING'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT';

export type WalletTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export type WalletTransactionDirection = 'CREDIT' | 'DEBIT';

export type GetWalletTransactionsParams = {
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

export type WalletTransactionItem = {
  transaction_id: string | number;
  type: WalletTransactionType;
  amount: number;
  direction: WalletTransactionDirection;
  status: WalletTransactionStatus;
  description: string;
  balance_after: number;
  reference_id: string | number | null;
  created_at: string;
};

export type WalletTransactionsPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type WalletTransactionsSummary = {
  total_credit: number;
  total_debit: number;
  period_net: number;
};

export type GetWalletTransactionsSuccessResponse = {
  data: WalletTransactionItem[];
  pagination: WalletTransactionsPagination;
  summary: WalletTransactionsSummary;
};

export type WalletTransactionReferenceType = 'ORDER' | 'TOPUP' | 'WITHDRAWAL' | null;

export type WalletTransactionDetailResponse = {
  transaction_id: string | number;
  type: WalletTransactionType;
  amount: number;
  direction: WalletTransactionDirection;
  status: WalletTransactionStatus;
  description: string;
  balance_before: number;
  balance_after: number;
  reference_id: string | number | null;
  reference_type: WalletTransactionReferenceType;
  payment_method: TopUpPaymentMethod | string | null;
  payment_instruction: string | Record<string, unknown> | null;
  payment_reference: string | null;
  confirmed_by: string | number | null;
  created_at: string;
  updated_at: string;
};

export type WalletTransactionDetailForbiddenResponse = {
  message?: string;
};

export type WalletTransactionDetailNotFoundResponse = {
  message?: string;
};

export async function getMyWallet(accessToken: string): Promise<GetMyWalletSuccessResponse> {
  return paymentFetch<GetMyWalletSuccessResponse>('/wallet/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getWalletTransactions(
  accessToken: string,
  params?: GetWalletTransactionsParams
): Promise<GetWalletTransactionsSuccessResponse> {
  const query = new URLSearchParams();

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

  if (params?.page !== undefined) {
    query.set('page', String(params.page));
  }

  if (params?.limit !== undefined) {
    query.set('limit', String(params.limit));
  }

  const queryString = query.toString();

  return paymentFetch<GetWalletTransactionsSuccessResponse>(
    `/wallet/transactions${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

export async function getWalletTransactionById(
  accessToken: string,
  transactionId: string
): Promise<WalletTransactionDetailResponse> {
  return paymentFetch<WalletTransactionDetailResponse>(
    `/wallet/transactions/${encodeURIComponent(transactionId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}
