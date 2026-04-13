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

export const paymentApi = {
  fetch: paymentFetch,
  getMyWallet,
  getAdminWalletByUserId,
  createTopUpTransaction,
};
