// [AGENT-GENERATED] Component to display wallet transaction history with sent/received indicators.
"use client";

import { useTransactionHistory } from "@/hooks/web3/useTransactionHistory";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";

export const TransactionHistory = () => {
  const { transactions, isLoading, error } = useTransactionHistory();

  // [Agent-Generated] Loading state with spinner.
  if (isLoading) {
    return (
      <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm mt-6 h-125 flex flex-col">
        <CardHeader>
          <h3 className="text-xl font-bold text-text-primary">
            Recent Activity
          </h3>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
        </CardContent>
      </Card>
    );
  }

  // [Agent-Generated] Error state display.
  if (error) {
    return (
      <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm mt-6 h-125 flex flex-col">
        <CardHeader>
          <h3 className="text-xl font-bold text-text-primary">
            Recent Activity
          </h3>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  // [Agent-Generated] Empty state when no transactions found.
  if (transactions.length === 0) {
    return (
      <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm mt-6 h-125 flex flex-col">
        <CardHeader>
          <h3 className="text-xl font-bold text-text-primary">
            Recent Activity
          </h3>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🎲</div>
            <p className="text-text-secondary">No recent activity</p>
            <p className="text-sm text-text-tertiary mt-2">Start playing to see your history here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // [Agent-Generated] Display transaction list with scroll (up to 10 items).
  return (
    <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm mt-6 h-76.25 flex flex-col">
      <CardHeader className="shrink-0">
        <h3 className="text-xl font-bold text-text-primary">
          Recent Activity
        </h3>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {transactions.slice(0, 10).map((tx, index) => (
            <div
              key={`${tx.hash}-${tx.timestamp}-${index}`}
              className="flex items-center justify-between p-4 rounded-lg bg-bg-primary/50 hover:bg-bg-primary/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    tx.type === "received"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {tx.type === "received" ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="font-semibold text-text-primary">
                    {tx.type === "received" ? "Received" : "Sent"}
                  </span>
                  <span className="text-sm text-text-tertiary">
                    {tx.type === "received" ? "From" : "To"}: {" "}
                    {tx.type === "received"
                      ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
                      : tx.to
                      ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                      : "Contract"}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {new Date(tx.timestamp).toLocaleString("en-US", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`font-bold ${
                    tx.type === "received" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {tx.type === "received" ? "+" : "-"}
                  {parseFloat(tx.value).toFixed(4)} ETH
                </span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                >
                  View on Etherscan →
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
