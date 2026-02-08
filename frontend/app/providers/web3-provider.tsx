"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { useState, useEffect, useMemo } from "react";

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // [Agent-Generated] Create config only on client mount to prevent SSR errors.
  const config = useMemo(() => {
    if (!isMounted) return null;
    
    return createConfig(
      getDefaultConfig({
        // Your dApps chains
        chains: [mainnet],
        transports: {
          // RPC URL for each chain
          [mainnet.id]: http(
            `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`,
          ),
        },

        // Required API Keys
        walletConnectProjectId:
          process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

        // Required App Info
        appName: "Wambling3",

        // Optional App Info
        appDescription: "Your App Description",
        appUrl: window.location.origin,
        appIcon: "https://family.co/logo.png",
      }),
    );
  }, [isMounted]);

  // [Agent-Generated] Prevent SSR hydration issues by waiting for client mount.
  if (!isMounted || !config) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
