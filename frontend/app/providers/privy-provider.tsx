"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";

export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
  // [AGENT-GENERATED] Client component: render directly without mount state.

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
