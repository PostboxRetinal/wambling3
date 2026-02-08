// [Agent-Generated] Hook to create and track SessionFactory transactions.
"use client";

import { useCallback, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
  parseEther,
  type EIP1193Provider,
  type Hex,
  type TransactionReceipt,
} from "viem";
import { toast } from "sonner";
import {
  assertSessionFactoryAddress,
  GAME_TYPE_MAP,
  SESSION_FACTORY_ABI,
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
  type GameId,
} from "@/lib/contracts/sessionFactory";

export type SessionFactoryTxStatus =
  | "idle"
  | "signing"
  | "pending"
  | "confirmed"
  | "failed";

type SessionFactoryTxState = {
  status: SessionFactoryTxStatus;
  hash: Hex | null;
  error: string | null;
  receipt: TransactionReceipt | null;
  estimatedGas: bigint | null;
  sessionId: string | null;
};

type CreateSessionParams = {
  gameId: GameId;
  betAmount: string;
};

const createInitialTxState = (): SessionFactoryTxState => ({
  status: "idle",
  hash: null,
  error: null,
  receipt: null,
  estimatedGas: null,
  sessionId: null,
});

export const useSessionFactory = () => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [txState, setTxState] = useState<SessionFactoryTxState>(
    createInitialTxState(),
  );

  // [Agent-Generated] Public client for read/simulate/receipt operations.
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
    // [Agent-Generated] Enforce authenticated wallet presence.
    if (!authenticated) {
      throw new Error("Conecta tu wallet para continuar.");
    }

    const wallet = wallets[0];
    if (!wallet) {
      throw new Error("No se encontro una wallet activa.");
    }

    // [Agent-Generated] Pull the EIP-1193 provider from Privy.
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
    // [Agent-Generated] Detect current chain and switch if it mismatches.
    const chainIdHex = (await provider.request({
      method: "eth_chainId",
    })) as string;
    const chainId = Number(chainIdHex);

    if (chainId === SESSION_FACTORY_CHAIN.id) return;

    const targetChainIdHex = `0x${SESSION_FACTORY_CHAIN.id.toString(16)}`;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainIdHex }],
      });
    } catch (error) {
      // [Agent-Generated] Attempt to add the chain if it is not configured.
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: targetChainIdHex,
            chainName: SESSION_FACTORY_CHAIN.name,
            rpcUrls: [SESSION_FACTORY_RPC_URL],
            nativeCurrency: SESSION_FACTORY_CHAIN.nativeCurrency,
            blockExplorerUrls: SESSION_FACTORY_CHAIN.blockExplorers?.default
              ?.url
              ? [SESSION_FACTORY_CHAIN.blockExplorers.default.url]
              : undefined,
          },
        ],
      });
    }
  }, []);

  const decodeSessionCreated = useCallback(
    (receipt: TransactionReceipt): string | null => {
      // [Agent-Generated] Extract the new session id from event logs.
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: SESSION_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "SessionCreated") {
            const args = decoded.args as
              | { sessionId?: bigint }
              | readonly unknown[]
              | undefined;

            if (args && typeof args === "object" && "sessionId" in args) {
              const sessionId = (args as { sessionId?: bigint }).sessionId;
              if (sessionId !== undefined) return sessionId.toString();
            }
          }
        } catch (error) {
          // [Agent-Generated] Skip non-matching logs.
          continue;
        }
      }

      return null;
    },
    [],
  );

  const createSession = useCallback(
    async ({ gameId, betAmount }: CreateSessionParams) => {
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        sessionId: null,
      }));

      try {
        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        // [Agent-Generated] Build clients for simulate + write flow.
        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const contractAddress = assertSessionFactoryAddress();

        // [Agent-Generated] Validate bet amount before parsing.
        if (!betAmount || Number.isNaN(Number(betAmount))) {
          throw new Error("Monto de apuesta invalido.");
        }

        const betWei = parseEther(betAmount);
        if (betWei <= BigInt(0)) {
          throw new Error("El monto debe ser mayor a 0.");
        }

        const gameType = GAME_TYPE_MAP[gameId];

        const functionName = "createSession";
        const args = [betWei, gameType] as const;
        const value = betWei;

        // [Agent-Generated] Simulate to validate and build request.
        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: SESSION_FACTORY_ABI,
          functionName,
          args,
          account: address,
          value,
        });

        // [Agent-Generated] Estimate gas for transparent UX.
        const estimatedGas = await publicClient.estimateContractGas({
          ...simulation.request,
          account: address,
        });

        setTxState((prev) => ({
          ...prev,
          estimatedGas,
        }));

        // [Agent-Generated] Write transaction via wallet client.
        const hash = await walletClient.writeContract({
          ...simulation.request,
          gas: estimatedGas,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
        }));

        toast.message("Transaccion enviada", {
          description: "Esperando confirmacion en la red.",
        });

        // [Agent-Generated] Wait for confirmation on-chain.
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        const sessionId = decodeSessionCreated(receipt);

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          sessionId,
        }));

        toast.success("Sesion creada", {
          description: sessionId
            ? `Sesion: ${sessionId}`
            : "Sesion confirmada en la red.",
        });

        return {
          receipt,
          sessionId,
          hash,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo completar la transaccion.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
        }));

        toast.error("Error al crear la sesion", {
          description: message,
        });

        throw error;
      }
    },
    [decodeSessionCreated, ensureCorrectChain, ensureWalletReady, publicClient],
  );

  return {
    createSession,
    txState,
    resetTxState,
    chain: SESSION_FACTORY_CHAIN,
  };
};
