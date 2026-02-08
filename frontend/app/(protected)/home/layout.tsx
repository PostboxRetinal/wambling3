import { WalletBalance } from "@/components/web3";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className=" bg-linear-to-br from-bg-primary via-bg-primary to-bg-secondary">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="animate-fade-in">
              <WalletBalance />
            </div>
          </div>
          <div className="lg:col-span-2">{children}</div>
        </div>
      </div>
    </main>
  );
}
