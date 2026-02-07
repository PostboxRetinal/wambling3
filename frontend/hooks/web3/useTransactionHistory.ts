// [Agent-Generated] Hook to fetch and manage wallet transaction history from Alchemy API.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallets } from "@privy-io/react-auth";

// [Agent-Generated] Type definition for Alchemy's asset transfer response.
interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string | null;
  value?: number;
  blockNum: string;
  metadata?: {
    blockTimestamp: string;
  };
}

// [Agent-Generated] Normalized transaction structure for UI consumption.
interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: string;
  type: "sent" | "received";
  blockNum: string;
}

// [Agent-Generated] Hook return type with transactions and loading state.
interface UseTransactionHistoryResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTransactionHistory = (): UseTransactionHistoryResult => {
  const { wallets } = useWallets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = wallets[0]?.address;

  // [Agent-Generated] Fetch both sent and received transactions from Alchemy Enhanced API.
  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_ID;
      const baseUrl = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;

      // [Agent-Generated] Fetch sent transactions (from this wallet).
      const sentResponse = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [
            {
              fromAddress: walletAddress,
              category: ["external", "internal", "erc20", "erc721", "erc1155"],
              withMetadata: true,
              maxCount: "0x14", // 20 transactions
            },
          ],
        }),
      });

      // [Agent-Generated] Fetch received transactions (to this wallet).
      const receivedResponse = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "alchemy_getAssetTransfers",
          params: [
            {
              toAddress: walletAddress,
              category: ["external", "internal", "erc20", "erc721", "erc1155"],
              withMetadata: true,
              maxCount: "0x14", // 20 transactions
            },
          ],
        }),
      });

      const [sentData, receivedData] = await Promise.all([
        sentResponse.json(),
        receivedResponse.json(),
      ]);

      // [Agent-Generated] Map Alchemy transfers to normalized transaction objects.
      const sentTxs =
        sentData?.result?.transfers?.map((tx: AlchemyTransfer) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value?.toString() || "0",
          timestamp: tx.metadata?.blockTimestamp || "",
          type: "sent" as const,
          blockNum: tx.blockNum,
        })) || [];

      const receivedTxs =
        receivedData?.result?.transfers?.map((tx: AlchemyTransfer) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value?.toString() || "0",
          timestamp: tx.metadata?.blockTimestamp || "",
          type: "received" as const,
          blockNum: tx.blockNum,
        })) || [];

      // [Agent-Generated] Combine and sort by timestamp (most recent first).
      const allTxs = [...sentTxs, ...receivedTxs].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setTransactions(allTxs);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
};
