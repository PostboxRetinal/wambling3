"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { useMemo, useState } from "react";

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  // [AGENT-GENERATED] Keep QueryClient stable across renders.
  const [queryClient] = useState(() => new QueryClient());
  const isClient = typeof window !== "undefined";

  // [AGENT-GENERATED] Only build Wagmi config on the client to avoid indexedDB SSR.
  const config = useMemo(() => {
    if (!isClient) return null;

    const appUrl = window.location.origin;

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
        appUrl,
        appIcon: "https://family.co/logo.png",
      }),
    );
  }, [isClient]);

  if (!isClient || !config) {
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
