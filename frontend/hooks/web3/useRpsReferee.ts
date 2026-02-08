// [AGENT-GENERATED]
// [Agent-Generated] Hook to generate referee signatures for RPS payouts.
"use client";

import { useCallback, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  type EIP1193Provider,
} from "viem";
import { SESSION_FACTORY_CHAIN, SESSION_FACTORY_RPC_URL } from "@/lib/contracts/sessionFactory";
import { RPS_ABI } from "@/lib/contracts/rps";

const REFEREE_TYPES = {
  RefereeDecision: [
    { name: "gameId", type: "uint256" },
    { name: "winner", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export type RefereeSignatureState = {
  status: "idle" | "signing" | "signed" | "failed";
  signature: `0x${string}` | null;
  error: string | null;
  pot: string | null;
  nonce: string | null;
  player1: string | null;
  player2: string | null;
  gameState: number | null;
  round: number | null;
  winsP1: number | null;
  winsP2: number | null;
  bestOf: number | null;
};

const createInitialState = (): RefereeSignatureState => ({
  status: "idle",
  signature: null,
  error: null,
  pot: null,
  nonce: null,
  player1: null,
  player2: null,
  gameState: null,
  round: null,
  winsP1: null,
  winsP2: null,
  bestOf: null,
});

export const useRpsReferee = () => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [state, setState] = useState<RefereeSignatureState>(createInitialState());

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: SESSION_FACTORY_CHAIN,
        transport: http(SESSION_FACTORY_RPC_URL),
      }),
    [],
  );

  const ensureWalletReady = useCallback(async () => {
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
      provider,
      address: wallet.address as `0x${string}`,
    };
  }, [authenticated, wallets]);

  const ensureCorrectChain = useCallback(async (provider: EIP1193Provider) => {
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

  const reset = useCallback(() => {
    setState(createInitialState());
  }, []);

  const signDecision = useCallback(
    async ({
      escrowAddress,
      gameId,
      winner,
    }: {
      escrowAddress: string;
      gameId: string;
      winner: string;
    }) => {
      setState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        signature: null,
      }));

      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }
        if (!isAddress(winner)) {
          throw new Error("Winner address is invalid.");
        }
        const parsedGameId = Number(gameId);
        if (!Number.isFinite(parsedGameId) || parsedGameId < 0) {
          throw new Error("Game ID must be a valid number.");
        }

        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const [gameInfo, nonce] = await Promise.all([
          publicClient.readContract({
            address: escrowAddress as `0x${string}`,
            abi: RPS_ABI,
            functionName: "games",
            args: [BigInt(parsedGameId)],
          }),
          publicClient.readContract({
            address: escrowAddress as `0x${string}`,
            abi: RPS_ABI,
            functionName: "nonces",
            args: [BigInt(parsedGameId)],
          }),
        ]);

        const typedGameInfo = gameInfo as readonly unknown[];
        const player1 = typedGameInfo[0] as string | undefined;
        const player2 = typedGameInfo[1] as string | undefined;
        const pot = typedGameInfo[5] as bigint;
        const bestOf = Number(typedGameInfo[6] ?? 0);
        const winsP1 = Number(typedGameInfo[7] ?? 0);
        const winsP2 = Number(typedGameInfo[8] ?? 0);
        const round = Number(typedGameInfo[9] ?? 0);
        const gameState = Number(typedGameInfo[10] ?? 0);

        if (!player1 || !player2) {
          throw new Error("Game players could not be loaded.");
        }

        const normalizedWinner = winner.toLowerCase();
        if (
          normalizedWinner !== player1.toLowerCase() &&
          normalizedWinner !== player2.toLowerCase()
        ) {
          throw new Error("Winner must be one of the game players.");
        }

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
          account: address,
        });

        const signature = await walletClient.signTypedData({
          account: address,
          domain: {
            name: "Wambling3 RockPaperScissors",
            version: "1",
            chainId: SESSION_FACTORY_CHAIN.id,
            verifyingContract: escrowAddress as `0x${string}`,
          },
          types: REFEREE_TYPES,
          primaryType: "RefereeDecision",
          message: {
            gameId: BigInt(parsedGameId),
            winner: winner as `0x${string}`,
            amount: pot,
            nonce: nonce as bigint,
          },
        });

        setState({
          status: "signed",
          signature,
          error: null,
          pot: pot.toString(),
          nonce: (nonce as bigint).toString(),
          player1,
          player2,
          gameState,
          round,
          winsP1,
          winsP2,
          bestOf,
        });

        return { signature, pot: pot.toString(), nonce: (nonce as bigint).toString() };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not sign the decision.";

        setState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
        }));

        throw error;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient],
  );

  const loadGameInfo = useCallback(
    async ({ escrowAddress, gameId }: { escrowAddress: string; gameId: string }) => {
      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }
        const parsedGameId = Number(gameId);
        if (!Number.isFinite(parsedGameId) || parsedGameId < 0) {
          throw new Error("Game ID must be a valid number.");
        }

        const [gameInfo, nonce] = await Promise.all([
          publicClient.readContract({
            address: escrowAddress as `0x${string}`,
            abi: RPS_ABI,
            functionName: "games",
            args: [BigInt(parsedGameId)],
          }),
          publicClient.readContract({
            address: escrowAddress as `0x${string}`,
            abi: RPS_ABI,
            functionName: "nonces",
            args: [BigInt(parsedGameId)],
          }),
        ]);

        const typedGameInfo = gameInfo as readonly unknown[];
        const player1 = typedGameInfo[0] as string | undefined;
        const player2 = typedGameInfo[1] as string | undefined;
        const pot = typedGameInfo[5] as bigint;
        const bestOf = Number(typedGameInfo[6] ?? 0);
        const winsP1 = Number(typedGameInfo[7] ?? 0);
        const winsP2 = Number(typedGameInfo[8] ?? 0);
        const round = Number(typedGameInfo[9] ?? 0);
        const gameState = Number(typedGameInfo[10] ?? 0);

        setState((prev) => ({
          ...prev,
          error: null,
          pot: pot?.toString() ?? null,
          nonce: (nonce as bigint).toString(),
          player1: player1 ?? null,
          player2: player2 ?? null,
          gameState,
          round,
          winsP1,
          winsP2,
          bestOf,
        }));

        return {
          player1,
          player2,
          pot: pot?.toString(),
          nonce: (nonce as bigint).toString(),
          gameState,
          round,
          winsP1,
          winsP2,
          bestOf,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load game info.";
        setState((prev) => ({
          ...prev,
          error: message,
        }));
        throw error;
      }
    },
    [publicClient],
  );

  return {
    state,
    reset,
    signDecision,
    loadGameInfo,
  };
};
