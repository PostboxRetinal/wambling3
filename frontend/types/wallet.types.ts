import type { Chain } from "viem";

export interface UseWalletBalanceProps {
  chain?: Chain;
  autoRefreshMs?: number;
}

export interface SendTransactionParams {
  to: string;
  amount: string;
}

export interface TransactionState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}
