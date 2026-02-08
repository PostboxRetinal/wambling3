// [AGENT-GENERATED]
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
  type TransactionReceipt,
} from "viem";
import { toast } from "sonner";
import {
  assertSessionFactoryAddress,
  bytes16ToUuid,
  generateUuidV4,
  GAME_TYPE_MAP,
  SESSION_FACTORY_ABI,
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
  uuidToBytes16,
} from "@/lib/contracts/sessionFactory";
import type {
  CreateSessionParams,
  CreateRpsCloneParams,
  SessionFactoryTxState,
} from "@/types/sessionFactory.types";

const createInitialTxState = (): SessionFactoryTxState => ({
  status: "idle",
  hash: null,
  error: null,
  receipt: null,
  estimatedGas: null,
  sessionId: null,
  cloneAddress: null,
  action: null,
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
              | { sessionId?: `0x${string}` }
              | readonly unknown[]
              | undefined;

            if (args && typeof args === "object" && "sessionId" in args) {
              const sessionId = (args as { sessionId?: `0x${string}` }).sessionId;
              if (sessionId) return bytes16ToUuid(sessionId);
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

  const decodeRpsCloneCreated = useCallback(
    (receipt: TransactionReceipt): string | null => {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: SESSION_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "RpsCloneCreated") {
            const args = decoded.args as
              | { clone?: `0x${string}` }
              | readonly unknown[]
              | undefined;

            if (args && typeof args === "object" && "clone" in args) {
              const clone = (args as { clone?: `0x${string}` }).clone;
              if (clone) return clone;
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

  const createSession = useCallback(
    async ({ gameId, betAmount }: CreateSessionParams) => {
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        sessionId: null,
        cloneAddress: null,
        action: "create-session",
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

        const sessionId = generateUuidV4();
        const sessionIdBytes = uuidToBytes16(sessionId);

        const functionName = "createSession";
        const args = [sessionIdBytes, betWei, gameType] as const;
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
          action: "create-session",
        }));

        toast.message("Transaccion enviada", {
          description: "Esperando confirmacion en la red.",
        });

        // [Agent-Generated] Wait for confirmation on-chain.
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        const emittedSessionId = decodeSessionCreated(receipt);

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          sessionId: emittedSessionId ?? sessionId,
          action: "create-session",
        }));

        toast.success("Sesion creada", {
          description: emittedSessionId ?? sessionId
            ? `Sesion: ${emittedSessionId ?? sessionId}`
            : "Sesion confirmada en la red.",
        });

        return {
          receipt,
          sessionId: emittedSessionId ?? sessionId,
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
          action: "create-session",
        }));

        toast.error("Error al crear la sesion", {
          description: message,
        });

        throw error;
      }
    },
    [decodeSessionCreated, ensureCorrectChain, ensureWalletReady, publicClient],
  );

  const createRpsClone = useCallback(
    async ({ refereeAddress }: CreateRpsCloneParams) => {
      setTxState((prev) => ({
        ...prev,
        status: "signing",
        error: null,
        cloneAddress: null,
        action: "create-escrow",
      }));

      try {
        const { provider, address } = await ensureWalletReady();
        await ensureCorrectChain(provider as EIP1193Provider);

        const walletClient = createWalletClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: custom(provider),
        });

        const contractAddress = assertSessionFactoryAddress();

        const simulation = await publicClient.simulateContract({
          address: contractAddress,
          abi: SESSION_FACTORY_ABI,
          functionName: "createRpsClone",
          args: [refereeAddress as `0x${string}`],
          account: address,
        });

        const estimatedGas = await publicClient.estimateContractGas({
          ...simulation.request,
          account: address,
        });

        setTxState((prev) => ({
          ...prev,
          estimatedGas,
        }));

        const hash = await walletClient.writeContract({
          ...simulation.request,
          gas: estimatedGas,
        });

        setTxState((prev) => ({
          ...prev,
          status: "pending",
          hash,
          action: "create-escrow",
        }));

        toast.message("Escrow enviado", {
          description: "Creando el contrato de escrow.",
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        const cloneAddress = decodeRpsCloneCreated(receipt);

        setTxState((prev) => ({
          ...prev,
          status: "confirmed",
          receipt,
          cloneAddress: cloneAddress ?? null,
          action: "create-escrow",
        }));

        toast.success("Escrow creado", {
          description: cloneAddress
            ? `Escrow: ${cloneAddress}`
            : "Escrow confirmado en la red.",
        });

        return { receipt, cloneAddress, hash };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo crear el escrow.";

        setTxState((prev) => ({
          ...prev,
          status: "failed",
          error: message,
          action: "create-escrow",
        }));

        toast.error("Error al crear escrow", {
          description: message,
        });

        throw error;
      }
    },
    [decodeRpsCloneCreated, ensureCorrectChain, ensureWalletReady, publicClient],
  );

  return {
    createSession,
    createRpsClone,
    txState,
    resetTxState,
    chain: SESSION_FACTORY_CHAIN,
  };
};
