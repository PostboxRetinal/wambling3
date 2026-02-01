// hooks/web3/useENS.ts
"use client";

import { useEnsName, useEnsAvatar } from "wagmi";
import { Address } from "viem";

type UseENSResult = {
  ensName?: string | null;
  ensAvatar?: string | null;
  isLoading: boolean;
  isError: boolean;
};

export function useENS(
  address?: Address
): UseENSResult {
  const {
    data: ensName,
    isLoading: isNameLoading,
    isError: isNameError,
  } = useEnsName({
    address,
    chainId: 1,
    query: {
      enabled: Boolean(address),
    },
  });

  const {
    data: ensAvatar,
    isLoading: isAvatarLoading,
    isError: isAvatarError,
  } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: 1,
    query: {
      enabled: Boolean(ensName),
    },
  });

  return {
    ensName,
    ensAvatar,
    isLoading: isNameLoading || isAvatarLoading,
    isError: isNameError || isAvatarError,
  };
}
