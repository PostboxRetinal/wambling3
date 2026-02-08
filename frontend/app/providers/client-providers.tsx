// [Agent-Generated] Client-only provider wrapper to prevent SSR hydration errors.
"use client";

import { PrivyProvider } from "./privy-provider";
import { Web3Provider } from "./web3-provider";

export const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivyProvider>
      <Web3Provider>{children}</Web3Provider>
    </PrivyProvider>
  );
};
