"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";
import { createPublicClient, http, formatEther, parseEther } from "viem";
import { toast } from "sonner";
import {
  sepolia,
  base,
  baseSepolia,
} from "viem/chains";
import type {
  SendTransactionParams,
  TransactionState,
  UseWalletBalanceProps,
} from "@/types/wallet.types";

export const useWalletBalance = ({
  chain = sepolia,
}: UseWalletBalanceProps = {}) => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isSubmitting: false,
    error: null,
    success: false,
  });

  const walletAddress = wallets[0]?.address;

  const publicClient = useMemo(() => 
    createPublicClient({ chain, transport: http() }), 
    [chain]
  );

  const fetchBalance = useCallback(async () => {
    if (!authenticated || !walletAddress) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    try {
      const balanceWei = await publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });
      setBalance(formatEther(balanceWei));
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance(null);
      toast.error("Failed to fetch balance", {
        description: "Could not connect to the network",
      });
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, walletAddress, publicClient]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const isValidAddress = (addr: string): boolean => 
    /^0x[a-fA-F0-9]{40}$/.test(addr);

  const isValidAmount = (amt: string): boolean => {
    const num = parseFloat(amt);
    return !isNaN(num) && num > 0;
  };

  const handleSendTransaction = useCallback(
    async ({ to, amount }: SendTransactionParams): Promise<void> => {
      setTransactionState({ isSubmitting: true, error: null, success: false });

      try {
        if (!wallets[0]) throw new Error("No wallet connected");
        if (!isValidAddress(to)) throw new Error("Invalid wallet address");
        if (!isValidAmount(amount)) throw new Error("Invalid amount");
        
        const amountNum = parseFloat(amount);
        const balanceNum = balance ? parseFloat(balance) : 0;
        if (amountNum > balanceNum) throw new Error("Insufficient balance");

        await sendTransaction({
          to: to as `0x${string}`,
          value: parseEther(amount),
        });

        setTransactionState({ isSubmitting: false, error: null, success: true });
        toast.success("Transaction successful", {
          description: `${amount} ETH sent successfully`,
        });
        
        await fetchBalance();
        
        setTimeout(() => {
          fetchBalance();
        }, 3000);
        
        setTimeout(() => {
          fetchBalance();
        }, 6000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send transaction";
        setTransactionState({ isSubmitting: false, error: errorMessage, success: false });
        toast.error("Transaction error", {
          description: errorMessage,
        });
        throw err;
      }
    },
    [wallets, sendTransaction, fetchBalance, balance]
  );

  const resetTransactionState = useCallback(() => {
    setTransactionState({ isSubmitting: false, error: null, success: false });
  }, []);

  return {
    balance,
    isLoading,
    address: walletAddress,
    refetch: fetchBalance,
    chain,
    handleSendTransaction,
    transactionState,
    resetTransactionState,
    isValidAddress,
    isValidAmount,
  };
};

export const AVAILABLE_CHAINS = [
  { chain: baseSepolia, label: "Base Sepolia (testnet)" },
  { chain: sepolia, label: "Ethereum Sepolia (testnet)" },
  { chain: base, label: "Base (mainnet)" },
] as const;
