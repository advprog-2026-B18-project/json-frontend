import { paymentFetch } from '../client';

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
