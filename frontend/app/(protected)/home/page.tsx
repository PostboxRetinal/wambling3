"use client";

import { StartBowl, TransactionHistory } from "@/components/web3";

export const dynamic = 'force-dynamic';

export default function LobbyPage() {
  return (
    <>
      {/* Games Section */}
      <StartBowl />

      {/* Recent Activity */}
      <TransactionHistory />
    </>
  );
}
