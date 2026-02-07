// [Agent-Generated] Game session hook for join/reveal and live player state.
"use client";

import { useCallback, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  bytesToHex,
  createPublicClient,
  createWalletClient,
  custom,
  encodePacked,
  http,
  isAddress,
  keccak256,
  parseEther,
  type Hex,
  type EIP1193Provider,
  type TransactionReceipt,
} from "viem";
import {
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
  type GameMode,
} from "@/lib/contracts/sessionFactory";

// [Agent-Generated] Minimal ABI for on-chain game session interactions.
const GAME_SESSION_ABI = [
  {
    type: "function",
    name: "getPlayers",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]", name: "" }],
  },
  {
    type: "function",
    name: "playerInfo",
    stateMutability: "view",
    inputs: [{ type: "address", name: "" }],
    outputs: [
      { type: "bool", name: "joined" },
      { type: "bool", name: "revealed" },
      { type: "bytes32", name: "commitment" },
      { type: "uint8", name: "choice" },
      { type: "uint256", name: "stake" },
    ],
  },
  {
    type: "function",
    name: "minBet",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "duration",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "createdAt",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "gameType",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8", name: "" }],
  },
  {
    type: "function",
    name: "sessionState",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8", name: "" }],
  },
  {
    type: "function",
    name: "resolution",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8", name: "" }],
  },
  {
    type: "function",
    name: "winner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
  },
  {
    type: "function",
    name: "isDraw",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool", name: "" }],
  },
  {
    type: "function",
    name: "joinSession",
    stateMutability: "payable",
    inputs: [{ type: "bytes32", name: "commitment" }],
    outputs: [],
  },
  {
    type: "function",
    name: "revealChoice",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint8", name: "choice" },
      { type: "bytes32", name: "nonce" },
    ],
    outputs: [],
  },
] as const;

// [Agent-Generated] Minimal ABI for on-site session interactions.
const GAME_SESSION_ONSITE_ABI = [
  {
    type: "function",
    name: "creator",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
  },
  {
    type: "function",
    name: "opponent",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
  },
  {
    type: "function",
    name: "arbiter",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
  },
  {
    type: "function",
    name: "stake",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "sessionState",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8", name: "" }],
  },
  {
    type: "function",
    name: "joinSession",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

type PlayerSnapshot = {
  address: `0x${string}`;
  joined: boolean;
  revealed: boolean;
  choice: number;
  stake: string;
};

type SessionSnapshot = {
  mode: GameMode;
  address: `0x${string}`;
  players: PlayerSnapshot[];
  minBet?: string;
  stake?: string;
  duration?: string;
  createdAt?: string;
  gameType?: number;
  sessionState?: number;
  resolution?: number;
  winner?: `0x${string}` | null;
  isDraw?: boolean;
  creator?: `0x${string}` | null;
  opponent?: `0x${string}` | null;
  arbiter?: `0x${string}` | null;
};

type ActionState = {
  status: "idle" | "signing" | "pending" | "confirmed" | "failed";
  hash: Hex | null;
  error: string | null;
  receipt: TransactionReceipt | null;
};

const createInitialActionState = (): ActionState => ({
  status: "idle",
  hash: null,
  error: null,
  receipt: null,
});

type UseGameSessionParams = {
  sessionAddress: string;
  mode: GameMode;
};

export const useGameSession = ({
  sessionAddress,
  mode,
}: UseGameSessionParams) => {
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
      throw new Error("Conecta tu wallet para continuar.");
    }

    const wallet = wallets[0];
    if (!wallet) {
      throw new Error("No se encontro una wallet activa.");
    }

    const provider = await wallet.getEthereumProvider();
    if (!provider?.request) {
      throw new Error("No se pudo acceder al proveedor de la wallet.");
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
    if (!sessionAddress || !isAddress(sessionAddress)) {
      setSnapshot(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "onchain") {
        // [Agent-Generated] Read on-chain game session state + players.
        const [players, minBet, duration, createdAt, gameType, sessionState, resolution, winner, isDraw] =
          await Promise.all([
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "getPlayers",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "minBet",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "duration",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "createdAt",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "gameType",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "sessionState",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "resolution",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "winner",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ABI,
              functionName: "isDraw",
            }),
          ]);

        // [Agent-Generated] Load per-player info for UI display.
        const playerSnapshots: PlayerSnapshot[] = [];
        for (const player of players as `0x${string}`[]) {
          const info = (await publicClient.readContract({
            address: sessionAddress as `0x${string}`,
            abi: GAME_SESSION_ABI,
            functionName: "playerInfo",
            args: [player],
          })) as [boolean, boolean, Hex, number, bigint];

          playerSnapshots.push({
            address: player,
            joined: info[0],
            revealed: info[1],
            choice: Number(info[3]),
            stake: info[4].toString(),
          });
        }

        setSnapshot({
          mode,
          address: sessionAddress as `0x${string}`,
          players: playerSnapshots,
          minBet: (minBet as bigint).toString(),
          duration: (duration as bigint).toString(),
          createdAt: (createdAt as bigint).toString(),
          gameType: Number(gameType),
          sessionState: Number(sessionState),
          resolution: Number(resolution),
          winner: winner as `0x${string}`,
          isDraw: Boolean(isDraw),
        });
      } else {
        // [Agent-Generated] Read on-site session data for lobby UI.
        const [creator, opponent, arbiter, stake, sessionState] =
          await Promise.all([
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ONSITE_ABI,
              functionName: "creator",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ONSITE_ABI,
              functionName: "opponent",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ONSITE_ABI,
              functionName: "arbiter",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ONSITE_ABI,
              functionName: "stake",
            }),
            publicClient.readContract({
              address: sessionAddress as `0x${string}`,
              abi: GAME_SESSION_ONSITE_ABI,
              functionName: "sessionState",
            }),
          ]);

        const players: PlayerSnapshot[] = [];
        if (creator && creator !== "0x0000000000000000000000000000000000000000") {
          players.push({
            address: creator as `0x${string}`,
            joined: true,
            revealed: false,
            choice: 0,
            stake: (stake as bigint).toString(),
          });
        }
        if (opponent && opponent !== "0x0000000000000000000000000000000000000000") {
          players.push({
            address: opponent as `0x${string}`,
            joined: true,
            revealed: false,
            choice: 0,
            stake: (stake as bigint).toString(),
          });
        }

        setSnapshot({
          mode,
          address: sessionAddress as `0x${string}`,
          players,
          stake: (stake as bigint).toString(),
          sessionState: Number(sessionState),
          creator: creator as `0x${string}`,
          opponent: opponent as `0x${string}`,
          arbiter: arbiter as `0x${string}`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error leyendo la sesion.";
      setError(message);
      setSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, [mode, publicClient, sessionAddress]);

  const joinOnchain = useCallback(
    async ({
      betAmount,
      choice,
      nonce,
    }: {
      betAmount: string;
      choice: number;
      nonce: Hex;
    }) => {
      if (!sessionAddress || !isAddress(sessionAddress)) {
        throw new Error("Direccion de sesion invalida.");
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

        // [Agent-Generated] Validate bet amount and build commitment.
        const betWei = parseEther(betAmount);
        if (betWei <= BigInt(0)) {
          throw new Error("La apuesta debe ser mayor a 0.");
        }

        const commitment = keccak256(
          encodePacked(
            ["uint8", "bytes32", "address", "address"],
            [choice, nonce, address, sessionAddress as `0x${string}`],
          ),
        );

        const simulation = await publicClient.simulateContract({
          address: sessionAddress as `0x${string}`,
          abi: GAME_SESSION_ABI,
          functionName: "joinSession",
          args: [commitment],
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
        const message = err instanceof Error ? err.message : "No se pudo unir.";
        setActionState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
        }));
        throw err;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient, refresh, resetActionState, sessionAddress],
  );

  const revealOnchain = useCallback(
    async ({ choice, nonce }: { choice: number; nonce: Hex }) => {
      if (!sessionAddress || !isAddress(sessionAddress)) {
        throw new Error("Direccion de sesion invalida.");
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

        const simulation = await publicClient.simulateContract({
          address: sessionAddress as `0x${string}`,
          abi: GAME_SESSION_ABI,
          functionName: "revealChoice",
          args: [choice, nonce],
          account: address,
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
        const message = err instanceof Error ? err.message : "No se pudo revelar.";
        setActionState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
        }));
        throw err;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient, refresh, resetActionState, sessionAddress],
  );

  const joinOnsite = useCallback(
    async ({ betAmount }: { betAmount: string }) => {
      if (!sessionAddress || !isAddress(sessionAddress)) {
        throw new Error("Direccion de sesion invalida.");
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
          throw new Error("La apuesta debe ser mayor a 0.");
        }

        const simulation = await publicClient.simulateContract({
          address: sessionAddress as `0x${string}`,
          abi: GAME_SESSION_ONSITE_ABI,
          functionName: "joinSession",
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
        const message = err instanceof Error ? err.message : "No se pudo unir.";
        setActionState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
        }));
        throw err;
      }
    },
    [ensureCorrectChain, ensureWalletReady, publicClient, refresh, resetActionState, sessionAddress],
  );

  const generateNonce = useCallback((): Hex => {
    // [Agent-Generated] Create random bytes32 nonce for commitment.
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }, []);

  return {
    snapshot,
    isLoading,
    error,
    refresh,
    joinOnchain,
    revealOnchain,
    joinOnsite,
    actionState,
    resetActionState,
    generateNonce,
  };
};
