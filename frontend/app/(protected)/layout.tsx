"use client";

// [AGENT-GENERATED]
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { DiceIcon } from "@/components/common/DiceIcon";
import { FullScreenLoader } from "@/components/common/FullScreenLoader";
import { useEnsName } from "@/hooks/web3/useEnsName";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, user } = usePrivy();
  const router = useRouter();
  const walletAddress = user?.wallet?.address ?? null;
  const { ensName, isLoading: isEnsLoading } = useEnsName(walletAddress);
  const hasEnsName = !!ensName;

  const formatAddress = (addr?: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, router, user]);

  if (!ready || (ready && !user)) {
    return <FullScreenLoader message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-primary/20 bg-linear-to-r from-bg-secondary/90 via-bg-tertiary/90 to-bg-secondary/90 backdrop-blur-xl shadow-lg shadow-primary/5 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link className="flex items-center gap-3 group" href="/home">
              <div className="relative">
                <DiceIcon className="h-12 w-12 text-primary group-hover:text-primary-dark transition-all duration-300 group-hover:rotate-12" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-linear-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent">
                  Wambling3
                </h1>
                <p className="text-xs text-text-tertiary font-medium">
                  Web3 Gambling Platform
                </p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-2 ml-auto mr-8">
              <Link
                className="px-4 py-2 rounded-lg text-sm font-semibold text-text-primary hover:text-primary hover:bg-primary/10 transition-all duration-300"
                href="/home"
              >
                Home
              </Link>
              {hasEnsName ? (
                <span
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-tertiary bg-bg-tertiary/40 border border-primary/10 cursor-not-allowed"
                  aria-disabled="true"
                  title="You already have an ENS registered"
                >
                  ENS Register (claimed)
                </span>
              ) : (
                <Link
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-primary hover:text-primary hover:bg-primary/10 transition-all duration-300"
                  href="/home/ens"
                >
                  ENS Register
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-bg-tertiary/50 border border-primary/20">
                <div className="text-right">
                  <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
                    ENS Registrar
                  </p>
                  <p className="text-sm text-primary font-mono font-bold">
                    {isEnsLoading
                      ? "Resolving..."
                      : ensName || formatAddress(walletAddress) || "No wallet"}
                  </p>
                  {user?.email?.address && (
                    <p className="text-[10px] text-text-tertiary font-medium">
                      {user.email.address}
                    </p>
                  )}
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
