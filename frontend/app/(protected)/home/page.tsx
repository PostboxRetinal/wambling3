import { WalletBalance } from "@/components/web3/WalletBalance";

export default function LobbyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary p-4">
      <WalletBalance />
    </main>
  );
}
