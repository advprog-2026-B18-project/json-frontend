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

export const paymentApi = {
  fetch: paymentFetch,
  getMyWallet,
  getAdminWalletByUserId,
  createTopUpTransaction,
  confirmTopUpTransaction,
  createWithdrawal,
};
