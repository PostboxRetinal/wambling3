"use client";

import { useState } from "react";
import { useWalletBalance, AVAILABLE_CHAINS } from "@/hooks/web3/useWallet";
import { useFundWallet, usePrivy } from "@privy-io/react-auth";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Copy, Check } from "lucide-react";
import type { Chain } from "viem";
import { TransactionDialog } from "./TransactionDialog";
import { toast } from "sonner";

export const WalletBalance = () => {
  const [selectedChain, setSelectedChain] = useState<Chain>(
    AVAILABLE_CHAINS[1].chain,
  );
  const [copied, setCopied] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const { ready, authenticated } = usePrivy();
  const { fundWallet } = useFundWallet();
  const { balance, isLoading, address, refetch } = useWalletBalance({
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

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFundWallet = async () => {
    if (!address || !ready || !authenticated || isFunding) return;

    try {
      setIsFunding(true);
      await fundWallet({
        address,
        options: {
          uiConfig: {
            receiveFundsTitle: "Add funds",
            receiveFundsSubtitle:
              "Scan the QR or copy your address to receive funds.",
          },
        },
      });
      await refetch();
    } catch (error) {
      console.error("Failed to open funding flow:", error);
      toast.error("Unable to open funding flow", {
        description: "Please try again in a few seconds.",
      });
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <Card className="w-full border-border-primary bg-linear-to-br from-bg-secondary to-bg-tertiary backdrop-blur-sm h-67.5 flex flex-col">
      <CardContent className="pt-6 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-primary/30">
            <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
              Wallet
            </span>
            <div className="flex items-center gap-2">
              <code className="text-sm text-text-primary font-mono px-3 py-1 rounded-md">
                {formatAddress(address)}
              </code>
              <Button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-bg-primary/50 rounded-md transition-colors border border-border-primary/20"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-text-tertiary hover:text-text-primary" />
                )}
              </Button>
            </div>
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
                <SelectTrigger className="w-50">
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
          <div className="flex flex-row gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Balance
              </span>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-text-tertiary text-sm">
                      Loading...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                      {formatBalance(balance)}
                    </span>
                    <span className="text-lg font-semibold text-text-secondary">
                      {selectedChain.nativeCurrency?.symbol || "ETH"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col w-50 items-end justify-end flex-1 gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-border-primary w-50 bg-bg-tertiary text-text-primary hover:bg-primary-dark"
                onClick={handleFundWallet}
                disabled={!ready || !authenticated || !address || isFunding}
              >
                {isFunding ? "Opening..." : "Add funds"}
              </Button>
              <TransactionDialog onTransactionComplete={refetch} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
