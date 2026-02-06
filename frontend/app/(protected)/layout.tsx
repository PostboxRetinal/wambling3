"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { DiceIcon } from "@/components/common/DiceIcon";
import { FullScreenLoader } from "@/components/common/FullScreenLoader";
import { usePrivy } from "@privy-io/react-auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, user } = usePrivy();

  if (!ready) {
    return <FullScreenLoader message="Inicializando..." />;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navbar con cerrar sesión */}
      <header className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DiceIcon className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-primary">
                  Wambling Casino
                </h1>
                <p className="text-xs text-text-tertiary">
                  Tu lugar para apostar con Web3
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs text-text-tertiary">Usuario</p>
                <p className="text-sm text-text-primary font-mono">
                  {user?.email?.address ||
                    (user?.wallet?.address
                      ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                      : "")}
                </p>
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
