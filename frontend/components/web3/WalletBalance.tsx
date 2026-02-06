"use client";

import { useState } from "react";
import {
  useWalletBalance,
  AVAILABLE_CHAINS,
} from "@/hooks/web3/useWalletBalance";
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { Chain } from "viem";

export const WalletBalance = () => {
  const [selectedChain, setSelectedChain] = useState<Chain>(
    AVAILABLE_CHAINS[1].chain,
  ); // Default a Sepolia
  const { balance, isLoading, error, address } = useWalletBalance({
    chain: selectedChain,
  });

  if (!address) {
    return null;
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string | null) => {
    if (!bal) return "0.0000";
    const num = parseFloat(bal);
    return num.toFixed(4);
  };

  const handleChainChange = (value: string) => {
    const chainId = parseInt(value);
    const selected = AVAILABLE_CHAINS.find((c) => c.chain.id === chainId);
    if (selected) {
      setSelectedChain(selected.chain);
    }
  };

  return (
    <Card className="w-full border-border-primary bg-gradient-to-br from-bg-secondary to-bg-tertiary backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-primary/30">
            <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
              Wallet
            </span>
            <code className="text-sm text-text-primary font-mono bg-bg-primary/50 px-3 py-1 rounded-md border border-border-primary/20">
              {formatAddress(address)}
            </code>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Network
              </span>
              <Select
                value={selectedChain.id.toString()}
                onValueChange={handleChainChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_CHAINS.map((item) => (
                    <SelectItem
                      key={item.chain.id}
                      value={item.chain.id.toString()}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
              Balance
            </span>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-text-tertiary text-sm">
                    Cargando...
                  </span>
                </div>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                    {formatBalance(balance)}
                  </span>
                  <span className="text-lg font-semibold text-text-secondary">
                    {selectedChain.nativeCurrency?.symbol || "ETH"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
