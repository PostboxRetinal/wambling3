// [Agent-Generated] Game session hook for join/reveal and live player state.
"use client";

import { useCallback, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  type EIP1193Provider,
} from "viem";
import {
  assertSessionFactoryAddress,
  isUuidV4,
  SESSION_FACTORY_ABI,
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
  uuidToBytes16,
} from "@/lib/contracts/sessionFactory";
import type {
  ActionState,
  PlayerSnapshot,
  SessionSnapshot,
  UseGameSessionParams,
} from "@/types/gameSession.types";

const createInitialActionState = (): ActionState => ({
  status: "idle",
  hash: null,
  error: null,
  receipt: null,
});

export const useGameSession = ({ sessionId }: UseGameSessionParams) => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>(
    createInitialActionState(),
  );

  // [Agent-Generated] Public client for read operations.
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: SESSION_FACTORY_CHAIN,
        transport: http(SESSION_FACTORY_RPC_URL),
      }),
    [],
  );

  const resetActionState = useCallback(() => {
    setActionState(createInitialActionState());
  }, []);

  const ensureWalletReady = useCallback(async () => {
    // [Agent-Generated] Require authenticated wallet for writes.
    if (!authenticated) {
      throw new Error("Connect your wallet to continue.");
    }

    const wallet = wallets[0];
    if (!wallet) {
      throw new Error("No active wallet found.");
    }

    const provider = await wallet.getEthereumProvider();
    if (!provider?.request) {
      throw new Error("Could not access wallet provider.");
    }

    return {
      wallet,
      provider,
      address: wallet.address as `0x${string}`,
    };
  }, [authenticated, wallets]);

  const ensureCorrectChain = useCallback(async (provider: EIP1193Provider) => {
    // [Agent-Generated] Switch wallet to the SessionFactory chain if needed.
    const chainIdHex = (await provider.request({
      method: "eth_chainId",
    })) as string;
    const chainId = Number(chainIdHex);

    if (chainId === SESSION_FACTORY_CHAIN.id) return;

    const targetChainIdHex = `0x${SESSION_FACTORY_CHAIN.id.toString(16)}`;

    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainIdHex }],
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId || !isUuidV4(sessionId)) {
      setSnapshot(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // [Agent-Generated] Read off-chain session data for lobby UI.
      const info = await publicClient.readContract({
        address: assertSessionFactoryAddress(),
        abi: SESSION_FACTORY_ABI,
        functionName: "sessionInfo",
        args: [uuidToBytes16(sessionId)],
      }) as any;

      const creator = info.creator ?? info[0];
      const opponent = info.opponent ?? info[1];
      const winner = info.winner ?? info[2];
      const stake = info.stake ?? info[3];
      const sessionState = info.state ?? info[5];

      const players: PlayerSnapshot[] = [];
      if (creator && creator !== "0x0000000000000000000000000000000000000000") {
        players.push({
          address: creator as `0x${string}`,
          joined: true,
          stake: (stake as bigint).toString(),
        });
      }
      if (opponent && opponent !== "0x0000000000000000000000000000000000000000") {
        players.push({
          address: opponent as `0x${string}`,
          joined: true,
          stake: (stake as bigint).toString(),
        });
      }

      setSnapshot({
        sessionId,
        players,
        stake: BigInt(stake).toString(),
        sessionState: Number(sessionState),
        creator: creator as `0x${string}`,
        opponent: opponent as `0x${string}`,
        winner: winner as `0x${string}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to read session.";
      setError(message);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, sessionId]);

  const joinOnsite = useCallback(
    async ({ betAmount }: { betAmount: string }) => {
      if (!sessionId || !isUuidV4(sessionId)) {
        throw new Error("Invalid session ID.");
      }

      resetActionState();
      setActionState((prev) => ({ ...prev, status: "signing", error: null }));

      try {
        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const betWei = parseEther(betAmount);
        if (betWei <= BigInt(0)) {
          throw new Error("Bet must be greater than 0.");
        }

        const simulation = await publicClient.simulateContract({
          address: assertSessionFactoryAddress(),
          abi: SESSION_FACTORY_ABI,
          functionName: "joinSession",
          args: [uuidToBytes16(sessionId)],
          account: address,
          value: betWei,
        });

        const hash = await walletClient.writeContract({
          ...simulation.request,
        });

        setActionState((prev) => ({
          ...prev,
          status: "pending",
          hash,
        }));

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setActionState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
        }));

        await refresh();
        return { hash, receipt };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not join.";
        setActionState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
        }));
        throw err;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient, refresh, resetActionState, sessionId],
  );

  return {
    snapshot,
    isLoading,
    error,
    refresh,
    joinOnsite,
    actionState,
    resetActionState,
  };
};
