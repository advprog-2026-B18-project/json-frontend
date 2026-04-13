import { paymentFetch } from './client';

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

export type TopUpPaymentMethod =
  | 'BANK_TRANSFER'
  | 'VIRTUAL_ACCOUNT'
  | 'QRIS'
  | 'EWALLET';

export type CreateTopUpTransactionInput = {
  amount: number;
  payment_method: TopUpPaymentMethod;
  bank_code?: string;
  idempotency_key: string;
};

export type CreateTopUpTransactionSuccessResponse = {
  transaction_id: string | number;
  type: 'TOPUP';
  amount: number;
  status: 'PENDING';
  created_at: string;
};

export type CreateTopUpTransactionBadRequestResponse = {
  error_field?: 'amount' | 'payment_method' | 'bank_code' | 'idempotency_key';
  message?: string;
};

export type CreateTopUpTransactionConflictResponse = {
  message?: string;
  existing_transaction_id?: string | number;
};

export type ConfirmTopUpSuccessResponse = {
  transaction_id: string | number;
  status: 'SUCCESS';
  amount: number;
  new_balance: number;
  confirmed_at: string;
};

export type ConfirmTopUpBadRequestResponse = {
  message?: string;
  expected?: number;
  received?: number;
};

export type ConfirmTopUpConflictResponse = {
  message?: string;
  status?: 'SUCCESS';
};

export type ConfirmTopUpAuth =
  | { accessToken: string; serviceKey?: never }
  | { serviceKey: string; accessToken?: never };

export type CreateWithdrawalInput = {
  amount: number;
  bank_account_id: string;
  idempotency_key: string;
  notes?: string;
};

export type WithdrawalBankAccountSummary = {
  bank_name: string;
  account_number_masked: string;
  account_name: string;
};

export type CreateWithdrawalSuccessResponse = {
  transaction_id: string | number;
  type: 'WITHDRAWAL';
  amount: number;
  status: 'PENDING';
  bank_account: WithdrawalBankAccountSummary;
  estimated_arrival: string;
  created_at: string;
};

export type CreateWithdrawalBadRequestResponse = {
  errors?: Array<{
    field: 'amount' | 'bank_account_id' | 'idempotency_key' | 'notes';
    message: string;
  }>;
};

export type CreateWithdrawalConflictResponse = {
  message?: string;
  existing_transaction_id?: string | number;
};

export type CreateWithdrawalUnprocessableResponse =
  | {
      message: 'Insufficient withdrawable balance';
      withdrawable: number;
      requested: number;
    }
  | {
      message: 'Bank account not found or not verified';
    };

export type ProcessWithdrawalAction = 'APPROVE' | 'REJECT';

export type ProcessWithdrawalApproveInput = {
  action: 'APPROVE';
  transfer_reference: string;
  processed_at: string;
  rejection_reason?: never;
};

export type ProcessWithdrawalRejectInput = {
  action: 'REJECT';
  rejection_reason: string;
  transfer_reference?: never;
  processed_at?: never;
};

export type ProcessWithdrawalInput =
  | ProcessWithdrawalApproveInput
  | ProcessWithdrawalRejectInput;

export type ProcessWithdrawalApproveSuccessResponse = {
  transaction_id: string | number;
  status: 'SUCCESS';
  amount: number;
  transfer_reference: string;
  processed_at: string;
};

export type ProcessWithdrawalRejectSuccessResponse = {
  transaction_id: string | number;
  status: 'FAILED';
  rejection_reason: string;
  balance_restored: true;
};

export type ProcessWithdrawalSuccessResponse =
  | ProcessWithdrawalApproveSuccessResponse
  | ProcessWithdrawalRejectSuccessResponse;

export type ProcessWithdrawalConflictResponse = {
  message?: string;
  current_status?: 'SUCCESS' | 'FAILED' | 'PENDING';
};

export type ProcessWithdrawalUnprocessableResponse = {
  message?: 'Transaction is not pending' | string;
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

export async function getMyWallet(accessToken: string): Promise<GetMyWalletSuccessResponse> {
  return paymentFetch<GetMyWalletSuccessResponse>('/wallet/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

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

export async function createTopUpTransaction(
  accessToken: string,
  input: CreateTopUpTransactionInput
): Promise<CreateTopUpTransactionSuccessResponse> {
  const requiresBankCode =
    input.payment_method === 'BANK_TRANSFER' || input.payment_method === 'VIRTUAL_ACCOUNT';

  if (requiresBankCode && !input.bank_code) {
    throw new Error('bank_code wajib diisi untuk metode BANK_TRANSFER atau VIRTUAL_ACCOUNT.');
  }

  return paymentFetch<CreateTopUpTransactionSuccessResponse>('/transaction/topup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export async function confirmTopUpTransaction(
  transactionId: string,
  auth: ConfirmTopUpAuth
): Promise<ConfirmTopUpSuccessResponse> {
  const headers: HeadersInit =
    'accessToken' in auth
      ? { Authorization: `Bearer ${auth.accessToken}` }
      : { 'X-Service-Key': auth.serviceKey };

  return paymentFetch<ConfirmTopUpSuccessResponse>(
    `/wallet/topup/${encodeURIComponent(transactionId)}/confirm`,
    {
      method: 'POST',
      headers,
    }
  );
}

export async function createWithdrawal(
  accessToken: string,
  input: CreateWithdrawalInput
): Promise<CreateWithdrawalSuccessResponse> {
  if (input.amount < 50_000) {
    throw new Error('Minimum withdrawal adalah Rp 50.000.');
  }

  if (input.notes && input.notes.length > 200) {
    throw new Error('Catatan maksimal 200 karakter.');
  }

  return paymentFetch<CreateWithdrawalSuccessResponse>('/wallet/withdraw', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
}

export async function processWithdrawal(
  accessToken: string,
  transactionId: string,
  input: ProcessWithdrawalInput
): Promise<ProcessWithdrawalSuccessResponse> {
  if (input.action === 'APPROVE') {
    if (!input.transfer_reference) {
      throw new Error('transfer_reference wajib diisi untuk action APPROVE.');
    }

    if (!input.processed_at) {
      throw new Error('processed_at wajib diisi untuk action APPROVE.');
    }
  }

  if (input.action === 'REJECT' && !input.rejection_reason) {
    throw new Error('rejection_reason wajib diisi untuk action REJECT.');
  }

  return paymentFetch<ProcessWithdrawalSuccessResponse>(
    `/admin/wallets/withdrawals/${encodeURIComponent(transactionId)}/process`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    }
  );
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

export const paymentApi = {
  fetch: paymentFetch,
  getMyWallet,
  getAdminWalletByUserId,
  createTopUpTransaction,
  confirmTopUpTransaction,
  createWithdrawal,
  processWithdrawal,
  getWalletTransactions,
  getWalletTransactionById,
  getAdminWalletTransactions,
};
