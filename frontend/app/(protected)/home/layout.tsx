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
      <header className="border-b border-border-primary bg-bg-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <DiceIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">Wambling3</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-text-secondary">
              {user?.email?.address || user?.wallet?.address}
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
