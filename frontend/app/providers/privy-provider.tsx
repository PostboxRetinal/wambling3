"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // [Agent-Generated] Prevent SSR hydration issues by waiting for client mount.
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
        },
        defaultChain: {
          id: 11155111, // Sepolia testnet
          name: "Sepolia",
          network: "sepolia",
          nativeCurrency: {
            decimals: 18,
            name: "SepoliaETH",
            symbol: "ETH",
          },
          rpcUrls: {
            default: {
              http: ["https://rpc.sepolia.org"],
            },
            public: {
              http: ["https://rpc.sepolia.org"],
            },
          },
        },
        // Configuración de apariencia
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
};
