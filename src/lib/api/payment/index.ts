import { paymentFetch } from '../client';

import { getAdminWalletByUserId, getAdminWalletTransactions, createManualWalletAdjustment } from './admin';
import { createTopUpTransaction, confirmTopUpTransaction } from './topup';
import { createWithdrawal, processWithdrawal } from './withdrawal';
import { getMyWallet, getWalletTransactions, getWalletTransactionById } from './wallet';

export * from './topup';
export * from './wallet';
export * from './withdrawal';
export * from './admin';

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
  createManualWalletAdjustment,
};
