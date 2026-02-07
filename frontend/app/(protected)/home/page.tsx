import { StartBowl, TransactionHistory } from "@/components/web3";

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
