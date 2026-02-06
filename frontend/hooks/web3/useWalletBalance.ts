"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, http, formatEther, type Chain } from "viem";
import { mainnet, sepolia, base, baseSepolia, optimism, arbitrum, polygon } from "viem/chains";

interface UseWalletBalanceProps {
  chain?: Chain;
}

export const useWalletBalance = ({ chain = sepolia }: UseWalletBalanceProps = {}) => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = wallets[0];
  const walletAddress = wallet?.address;

  // Memorizar el cliente para no recrearlo en cada render
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain,
      transport: http(),
    });
  }, [chain]);

  const fetchBalance = useCallback(async () => {
    if (!authenticated || !walletAddress) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const balanceWei = await publicClient.getBalance({
        address: walletAddress as `0x${string}`,
      });

      const balanceEth = formatEther(balanceWei);
      setBalance(balanceEth);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError("Error al obtener el balance");
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, walletAddress, publicClient]);

  // Solo fetch cuando cambie la dirección o autenticación
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    address: walletAddress,
    refetch: fetchBalance, // Exportar para refetch manual
    chain,
  };
};

export const AVAILABLE_CHAINS = [
  { chain: mainnet, label: "Ethereum" },
  { chain: sepolia, label: "Ethereum Sepolia" },
  { chain: base, label: "Base" },
  { chain: baseSepolia, label: "Base Sepolia" },
  { chain: optimism, label: "Optimism" },
  { chain: arbitrum, label: "Arbitrum One" },
  { chain: polygon, label: "Polygon" },
] as const;
