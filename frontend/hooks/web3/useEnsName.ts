// [AGENT-GENERATED]
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPublicClient, http, isAddress } from "viem";
import { sepolia } from "viem/chains";

type UseEnsNameResult = {
  ensName: string | null;
  isLoading: boolean;
  error: string | null;
};

export const useEnsName = (address?: string | null): UseEnsNameResult => {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(),
      }),
    [],
  );

  useEffect(() => {
    let isActive = true;

    const resolveEns = async () => {
      if (!address || !isAddress(address)) {
        setEnsName(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const name = await publicClient.getEnsName({
          address: address as `0x${string}`,
        });

        if (isActive) {
          setEnsName(name ?? null);
        }
      } catch (err) {
        if (isActive) {
          const message = err instanceof Error ? err.message : "ENS lookup failed";
          setError(message);
          setEnsName(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    resolveEns();

    return () => {
      isActive = false;
    };
  }, [address, publicClient]);

  return { ensName, isLoading, error };
};
