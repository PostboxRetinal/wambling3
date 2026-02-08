// [AGENT-GENERATED]
// [Agent-Generated] Hook to create on-chain RPS games with a per-game referee.
"use client";

import { useCallback, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
  encodePacked,
  isAddress,
  isHex,
  keccak256,
  parseEther,
  toBytes,
  type EIP1193Provider,
  type TransactionReceipt,
} from "viem";
import { SESSION_FACTORY_CHAIN, SESSION_FACTORY_RPC_URL } from "@/lib/contracts/sessionFactory";
import { RPS_ABI } from "@/lib/contracts/rps";

export type RpsGameTxStatus =
  | "idle"
  | "signing"
  | "pending"
  | "confirmed"
  | "failed";

export type RpsGameTxState = {
  status: RpsGameTxStatus;
  hash: `0x${string}` | null;
  error: string | null;
  receipt: TransactionReceipt | null;
  gameId: string | null;
  action: "create" | "join" | "commit" | "reveal" | "claim" | "claim-timeout" | null;
};

const createInitialTxState = (): RpsGameTxState => ({
  status: "idle",
  hash: null,
  error: null,
  receipt: null,
  gameId: null,
  action: null,
});

export type CreateRpsGameParams = {
  escrowAddress: string;
  refereeAddress: string;
  bestOf: number;
  betAmount: string;
};

export type JoinRpsGameParams = {
  escrowAddress: string;
  gameId: string;
  betAmount: string;
};

export type CommitRpsMoveParams = {
  escrowAddress: string;
  gameId: string;
  move: "rock" | "paper" | "scissors";
  salt: string;
};

export type RevealRpsMoveParams = CommitRpsMoveParams;

export const useRpsGame = () => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [txState, setTxState] = useState<RpsGameTxState>(createInitialTxState());

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: SESSION_FACTORY_CHAIN,
        transport: http(SESSION_FACTORY_RPC_URL),
      }),
    [],
  );

  const resetTxState = useCallback(() => {
    setTxState(createInitialTxState());
  }, []);

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

  const decodeGameCreated = useCallback(
    (receipt: TransactionReceipt): string | null => {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: RPS_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "GameCreated") {
            const args = decoded.args as
              | { gameId?: bigint }
              | readonly unknown[]
              | undefined;

            if (args && typeof args === "object" && "gameId" in args) {
              const gameId = (args as { gameId?: bigint }).gameId;
              return gameId?.toString() ?? null;
            }
          }
        } catch {
          continue;
        }
      }

      return null;
    },
    [],
  );

  const createGame = useCallback(
    async ({ escrowAddress, refereeAddress, bestOf, betAmount }: CreateRpsGameParams) => {
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        gameId: null,
        action: "create",
      }));

      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }
        if (!isAddress(refereeAddress)) {
          throw new Error("Referee address is invalid.");
        }
        if (!betAmount || Number.isNaN(Number(betAmount))) {
          throw new Error("Bet amount is invalid.");
        }
        if (bestOf < 3 || bestOf > 9 || bestOf % 2 === 0) {
          throw new Error("Best-of must be an odd number between 3 and 9.");
        }

        const betWei = parseEther(betAmount);
        if (betWei <= BigInt(0)) {
          throw new Error("Bet must be greater than 0.");
        }

        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const simulation = await publicClient.simulateContract({
          address: escrowAddress as `0x${string}`,
          abi: RPS_ABI,
          functionName: "createGame",
          args: [bestOf, refereeAddress as `0x${string}`],
          account: address,
          value: betWei,
        });

        const hash = await walletClient.writeContract({
          ...simulation.request,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
          action: "create",
        }));

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        const gameId = decodeGameCreated(receipt);

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          gameId,
          action: "create",
        }));

        return { hash, receipt, gameId };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not create the on-chain match.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
          action: "create",
        }));

        throw error;
      }
    },
    [decodeGameCreated, ensureCorrectChain, ensureWalletReady, publicClient],
  );

  const joinGame = useCallback(
    async ({ escrowAddress, gameId, betAmount }: JoinRpsGameParams) => {
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        gameId: null,
        action: "join",
      }));

      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }

        const parsedGameId = Number(gameId);
        if (!Number.isFinite(parsedGameId) || parsedGameId < 0) {
          throw new Error("Game ID must be a valid number.");
        }

        if (!betAmount || Number.isNaN(Number(betAmount))) {
          throw new Error("Bet amount is invalid.");
        }

        const betWei = parseEther(betAmount);
        if (betWei <= BigInt(0)) {
          throw new Error("Bet must be greater than 0.");
        }

        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const simulation = await publicClient.simulateContract({
          address: escrowAddress as `0x${string}`,
          abi: RPS_ABI,
          functionName: "joinGame",
          args: [BigInt(parsedGameId)],
          account: address,
          value: betWei,
        });

        const hash = await walletClient.writeContract({
          ...simulation.request,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
          action: "join",
        }));

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          gameId: parsedGameId.toString(),
          action: "join",
        }));

        return { hash, receipt, gameId: parsedGameId.toString() };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not join the on-chain match.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
          action: "join",
        }));

        throw error;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient],
  );

  const normalizeSalt = (salt: unknown): `0x${string}` => {
    // [AGENT-GENERATED] Defensive normalization to avoid undefined-length errors.
    if (typeof salt !== "string") {
      throw new Error("Salt is required.");
    }
    const trimmed = salt.trim();
    if (!trimmed) {
      throw new Error("Salt is required.");
    }
    if (isHex(trimmed) && trimmed.length === 66) {
      return trimmed as `0x${string}`;
    }
    return keccak256(toBytes(trimmed)) as `0x${string}`;
  };

  const moveToEnum = (move: "rock" | "paper" | "scissors"): number => {
    switch (move) {
      case "rock":
        return 1;
      case "paper":
        return 2;
      case "scissors":
        return 3;
      default:
        throw new Error("Move must be rock, paper, or scissors.");
    }
  };

  const commitMove = useCallback(
    async ({ escrowAddress, gameId, move, salt }: CommitRpsMoveParams) => {
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        gameId: null,
        action: "commit",
      }));

      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }

        const parsedGameId = Number(gameId);
        if (!Number.isFinite(parsedGameId) || parsedGameId < 0) {
          throw new Error("Game ID must be a valid number.");
        }

        const saltBytes32 = normalizeSalt(salt);
        if (
          typeof saltBytes32 !== "string" ||
          saltBytes32.length !== 66 ||
          !isHex(saltBytes32)
        ) {
          throw new Error("Salt must resolve to a 32-byte hex value.");
        }
        const moveEnum = moveToEnum(move);
        if (!Number.isInteger(moveEnum)) {
          throw new Error("Move must be rock, paper, or scissors.");
        }
        const commitment = keccak256(
          encodePacked(
            ["uint8", "bytes32"],
            [moveEnum, saltBytes32],
          ),
        );

        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const simulation = await publicClient.simulateContract({
          address: escrowAddress as `0x${string}`,
          abi: RPS_ABI,
          functionName: "commitMove",
          args: [BigInt(parsedGameId), commitment as `0x${string}`],
          account: address,
        });

        const hash = await walletClient.writeContract({
          ...simulation.request,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
          action: "commit",
        }));

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          gameId: parsedGameId.toString(),
          action: "commit",
        }));

        return { hash, receipt, commitment, salt: saltBytes32 };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not commit the move.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
          action: "commit",
        }));

        throw error;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient],
  );

  const revealMove = useCallback(
    async ({ escrowAddress, gameId, move, salt }: RevealRpsMoveParams) => {
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        gameId: null,
        action: "reveal",
      }));

      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }

        const parsedGameId = Number(gameId);
        if (!Number.isFinite(parsedGameId) || parsedGameId < 0) {
          throw new Error("Game ID must be a valid number.");
        }

        const saltBytes32 = normalizeSalt(salt);
        if (
          typeof saltBytes32 !== "string" ||
          saltBytes32.length !== 66 ||
          !isHex(saltBytes32)
        ) {
          throw new Error("Salt must resolve to a 32-byte hex value.");
        }
        const moveEnum = moveToEnum(move);
        if (!Number.isInteger(moveEnum)) {
          throw new Error("Move must be rock, paper, or scissors.");
        }

        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const simulation = await publicClient.simulateContract({
          address: escrowAddress as `0x${string}`,
          abi: RPS_ABI,
          functionName: "revealMove",
          args: [BigInt(parsedGameId), moveEnum, saltBytes32],
          account: address,
        });

        const hash = await walletClient.writeContract({
          ...simulation.request,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
          action: "reveal",
        }));

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          gameId: parsedGameId.toString(),
          action: "reveal",
        }));

        return { hash, receipt, salt: saltBytes32 };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not reveal the move.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
          action: "reveal",
        }));

        throw error;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient],
  );

  const claimPrize = useCallback(
    async ({ escrowAddress, gameId, signature }: { escrowAddress: string; gameId: string; signature: string }) => {
      // [AGENT-GENERATED] Claim jackpot with referee signature.
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        gameId: null,
        action: "claim",
      }));

      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }

        const parsedGameId = Number(gameId);
        if (!Number.isFinite(parsedGameId) || parsedGameId < 0) {
          throw new Error("Game ID must be a valid number.");
        }

        if (!signature || typeof signature !== "string" || !isHex(signature)) {
          throw new Error("Referee signature is required.");
        }

        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const simulation = await publicClient.simulateContract({
          address: escrowAddress as `0x${string}`,
          abi: RPS_ABI,
          functionName: "claimPrize",
          args: [BigInt(parsedGameId), signature as `0x${string}`],
          account: address,
        });

        const hash = await walletClient.writeContract({
          ...simulation.request,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
          action: "claim",
        }));

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          gameId: parsedGameId.toString(),
          action: "claim",
        }));

        return { hash, receipt };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not claim the jackpot.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
          action: "claim",
        }));

        throw error;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient],
  );

  const claimPrizeTimeout = useCallback(
    async ({ escrowAddress, gameId }: { escrowAddress: string; gameId: string }) => {
      // [AGENT-GENERATED] Claim jackpot after referee timeout.
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        gameId: null,
        action: "claim-timeout",
      }));

      try {
        if (!isAddress(escrowAddress)) {
          throw new Error("Escrow address is invalid.");
        }

        const parsedGameId = Number(gameId);
        if (!Number.isFinite(parsedGameId) || parsedGameId < 0) {
          throw new Error("Game ID must be a valid number.");
        }

        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const simulation = await publicClient.simulateContract({
          address: escrowAddress as `0x${string}`,
          abi: RPS_ABI,
          functionName: "claimPrizeTimeout",
          args: [BigInt(parsedGameId)],
          account: address,
        });

        const hash = await walletClient.writeContract({
          ...simulation.request,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
          action: "claim-timeout",
        }));

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          gameId: parsedGameId.toString(),
          action: "claim-timeout",
        }));

        return { hash, receipt };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not claim the jackpot.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
          action: "claim-timeout",
        }));

        throw error;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient],
  );

  return {
    txState,
    resetTxState,
    createGame,
    joinGame,
    commitMove,
    revealMove,
    claimPrize,
    claimPrizeTimeout,
  };
};
