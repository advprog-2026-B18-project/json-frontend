import { paymentFetch } from '../client';

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
