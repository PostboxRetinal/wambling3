export interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string | null;
  value?: number;
  blockNum: string;
  metadata?: {
    blockTimestamp: string;
  };
}

export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: string;
  type: "sent" | "received";
  blockNum: string;
}

export interface UseTransactionHistoryResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
