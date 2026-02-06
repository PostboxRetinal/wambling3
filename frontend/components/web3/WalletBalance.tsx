"use client";

import { useWalletBalance } from "@/hooks/web3/useWalletBalance";
import { Card, CardContent } from "@/components/ui/card";

export const WalletBalance = () => {
  const { balance, isLoading, error, address } = useWalletBalance();

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

  return (
    <Card className="w-full max-w-md border-border-primary bg-bg-secondary">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Wallet</span>
            <code className="text-sm text-text-primary font-mono">
              {formatAddress(address)}
            </code>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Balance (Sepolia)</span>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <span className="text-text-tertiary text-sm">Cargando...</span>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {formatBalance(balance)} ETH
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
