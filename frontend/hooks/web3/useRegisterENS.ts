"use client";

import { useState, useCallback, useMemo } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  formatEther,
  getContract,
  http,
  keccak256,
  type EIP1193Provider,
  type Hex,
} from "viem";
import { namehash } from "viem/ens";
import { sepolia } from "viem/chains";
import { toast } from "sonner";
import type {
  RegistrationState,
  UseRegisterENSResult,
} from "@/types/ens.types";

// [Agent-Generated] ENS Registrar Controller ABI (minimal for registration).
const REGISTRAR_CONTROLLER_ABI = [
  {
    name: "available",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "rentPrice",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "name", type: "string" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "base", type: "uint256" },
          { name: "premium", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "makeCommitment",
    type: "function",
    stateMutability: "pure",
    inputs: [
      {
        name: "registration",
        type: "tuple",
        components: [
          { name: "label", type: "string" },
          { name: "owner", type: "address" },
          { name: "duration", type: "uint256" },
          { name: "secret", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "data", type: "bytes[]" },
          { name: "reverseRecord", type: "uint8" },
          { name: "referrer", type: "bytes32" },
        ],
      },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "commit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitment", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "register",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "registration",
        type: "tuple",
        components: [
          { name: "label", type: "string" },
          { name: "owner", type: "address" },
          { name: "duration", type: "uint256" },
          { name: "secret", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "data", type: "bytes[]" },
          { name: "reverseRecord", type: "uint8" },
          { name: "referrer", type: "bytes32" },
        ],
      },
    ],
    outputs: [],
  },
] as const;

// [Agent-Generated] ENS Public Resolver ABI (minimal for reverse records).
const RESOLVER_ABI = [
  {
    name: "setName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "setAddr",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "addr", type: "address" },
    ],
    outputs: [],
  },
] as const;

// [Agent-Generated] ReverseRegistrar ABI (for setting reverse records).
const REVERSE_REGISTRAR_ABI = [
  {
    name: "setName",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
    outputs: [{ type: "bytes32" }],
  },
] as const;

// [Agent-Generated] Contract addresses for Sepolia testnet.
const ENS_REGISTRAR_CONTROLLER = (process.env.NEXT_PUBLIC_ENS_CONTROLLER ||
  "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72") as `0x${string}`;
const ENS_PUBLIC_RESOLVER = (process.env.NEXT_PUBLIC_ENS_RESOLVER ||
  "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD") as `0x${string}`;
const ENS_REVERSE_REGISTRAR = (process.env.NEXT_PUBLIC_ENS_REVERSE_REGISTRAR ||
  "0x084b1c3C81545d370f3634392De611CaaBFf8148") as `0x${string}`;

const REVERSE_RECORD_BOTH = 3; // Ethereum + Default
const ZERO_REFERRER =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;


export const useRegisterENS = (): UseRegisterENSResult => {
  const { wallets } = useWallets();
  const [state, setState] = useState<RegistrationState>({
    status: "idle",
    label: null,
    commitment: null,
    secret: null,
    price: null,
    duration: 31536000, // 1 year default
    waitTimeRemaining: 0,
    txHash: null,
    error: null,
  });

  const walletAddress = wallets[0]?.address;

  // [Agent-Generated] Public client for read operations.
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(),
      }),
    []
  );

  const ensureCorrectChain = useCallback(async (provider: EIP1193Provider) => {
    const chainIdHex = (await provider.request({
      method: "eth_chainId",
    })) as string;
    const chainId = Number(chainIdHex);

    if (chainId === sepolia.id) return;

    const targetChainIdHex = `0x${sepolia.id.toString(16)}`;
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainIdHex }],
    });
  }, []);

  // [Agent-Generated] Get wallet client for write operations.
  const getWalletClient = useCallback(async () => {
    if (!wallets[0]) throw new Error("No wallet connected");

    const provider = await wallets[0].getEthereumProvider();
    if (!provider) throw new Error("No provider available");

    await ensureCorrectChain(provider as EIP1193Provider);

    return createWalletClient({
      chain: sepolia,
      transport: custom(provider),
    });
  }, [ensureCorrectChain, wallets]);

  // [Agent-Generated] Get contract instances.
  const getContracts = useCallback(async () => {
    const walletClient = await getWalletClient();

    const controller = getContract({
      address: ENS_REGISTRAR_CONTROLLER,
      abi: REGISTRAR_CONTROLLER_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    const resolver = getContract({
      address: ENS_PUBLIC_RESOLVER,
      abi: RESOLVER_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    const reverseRegistrar = getContract({
      address: ENS_REVERSE_REGISTRAR,
      abi: REVERSE_REGISTRAR_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    return { controller, resolver, reverseRegistrar, walletClient };
  }, [publicClient, getWalletClient]);

  const buildResolverData = useCallback(
    (label: string, owner: `0x${string}`) => {
      // [Agent-Generated] Set forward record so reverse lookup validates the name.
      const node = namehash(`${label}.eth`);
      return [
        encodeFunctionData({
          abi: RESOLVER_ABI,
          functionName: "setAddr",
          args: [node, owner],
        }),
      ];
    },
    []
  );

  // [Agent-Generated] Check if ENS name is available.
  const checkAvailability = useCallback(
    async (label: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, status: "checking", label, error: null }));

      try {
        const { controller } = await getContracts();
        const available = await controller.read.available([label]);

        setState((prev) => ({ ...prev, status: "idle" }));
        return available;
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Failed to check availability";
        setState((prev) => ({ ...prev, status: "error", error }));
        toast.error("Error checking availability", { description: error });
        return false;
      }
    },
    [getContracts]
  );

  // [Agent-Generated] Get registration price for duration.
  const getPrice = useCallback(
    async (label: string, duration: number): Promise<string> => {
      try {
        const { controller } = await getContracts();
        const priceData = (await controller.read.rentPrice([
          label,
          BigInt(duration),
        ])) as { base: bigint; premium: bigint };
        const totalPrice = priceData.base + priceData.premium;

        return formatEther(totalPrice);
      } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to get price";
        toast.error("Error fetching price", { description: error });
        throw err;
      }
    },
    [getContracts]
  );

  // [Agent-Generated] Commit registration (TX 1 - requires 60s wait).
  const commitRegistration = useCallback(
    async (label: string, duration: number) => {
      if (!walletAddress) {
        toast.error("No wallet connected");
        return;
      }

      setState((prev) => ({
        ...prev,
        status: "committing",
        label,
        duration,
        error: null,
      }));

      try {
        const { controller } = await getContracts();

        // Generate random secret
        const randomValue = crypto.getRandomValues(new Uint8Array(32));
        const secret = keccak256(randomValue) as Hex;

        // Get price
        const priceData = (await controller.read.rentPrice([
          label,
          BigInt(duration),
        ])) as { base: bigint; premium: bigint };
        const totalPrice = priceData.base + priceData.premium;
        const price = formatEther(totalPrice);

        const resolverData = buildResolverData(
          label,
          walletAddress as `0x${string}`
        );

        // Create commitment
        const commitment = await controller.read.makeCommitment([
          {
            label,
            owner: walletAddress as `0x${string}`,
            duration: BigInt(duration),
            secret,
            resolver: ENS_PUBLIC_RESOLVER,
            data: resolverData,
            reverseRecord: REVERSE_RECORD_BOTH,
            referrer: ZERO_REFERRER,
          },
        ]);

        // Send commit transaction
        const hash = await controller.write.commit([commitment], {
          account: walletAddress as `0x${string}`,
        });

        toast.loading("Confirming commitment...", { id: "commit" });
        // Wait up to 5 minutes for transaction confirmation with 2s polling
        await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 300_000,
          pollingInterval: 2_000,
        });
        toast.success("Commitment confirmed!", { id: "commit" });

        // Start 60 second countdown
        setState((prev) => ({
          ...prev,
          status: "waiting",
          commitment,
          secret,
          price,
          txHash: hash,
          waitTimeRemaining: 60,
        }));

        // Countdown timer
        const interval = setInterval(() => {
          setState((prev) => {
            const newTime = prev.waitTimeRemaining - 1;
            if (newTime <= 0) {
              clearInterval(interval);
              return { ...prev, waitTimeRemaining: 0, status: "ready" };
            }
            return { ...prev, waitTimeRemaining: newTime };
          });
        }, 1000);
      } catch (err) {
        const error = err instanceof Error ? err.message : "Commitment failed";
        setState((prev) => ({ ...prev, status: "error", error }));
        toast.error("Commitment failed", { description: error });
      }
    },
    [walletAddress, getContracts, publicClient]
  );

  // [Agent-Generated] Complete registration (TX 2 - mint ENS).
  const completeRegistration = useCallback(async () => {
    if (
      !walletAddress ||
      !state.label ||
      !state.secret ||
      !state.commitment
    ) {
      toast.error("Missing registration data");
      return;
    }

    if (state.waitTimeRemaining > 0) {
      toast.error(`Wait ${state.waitTimeRemaining}s before registering`);
      return;
    }

    setState((prev) => ({ ...prev, status: "registering", error: null }));

    try {
      const { controller } = await getContracts();

      // Get current price with 5% buffer for slippage
      const priceData = (await controller.read.rentPrice([
        state.label,
        BigInt(state.duration),
      ])) as { base: bigint; premium: bigint };
      const totalPrice = priceData.base + priceData.premium;
      const priceWithBuffer = (totalPrice * BigInt(105)) / BigInt(100);

      const resolverData = buildResolverData(
        state.label,
        walletAddress as `0x${string}`
      );

      // Send register transaction
        const hash = await controller.write.register(
          [
            {
              label: state.label,
              owner: walletAddress as `0x${string}`,
              duration: BigInt(state.duration),
              secret: state.secret as Hex,
              resolver: ENS_PUBLIC_RESOLVER,
            data: resolverData,
              reverseRecord: REVERSE_RECORD_BOTH,
              referrer: ZERO_REFERRER,
            },
          ],
          {
            account: walletAddress as `0x${string}`,
            value: priceWithBuffer,
          }
        );

      toast.loading("Registering ENS name...", { id: "register" });
      // Wait up to 5 minutes for transaction confirmation with 2s polling
      await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 300_000,
        pollingInterval: 2_000,
      });
      toast.success(`${state.label}.eth registered successfully!`, {
        id: "register",
      });

      setState((prev) => ({
        ...prev,
        status: "completed",
        txHash: hash,
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : "Registration failed";
      setState((prev) => ({ ...prev, status: "error", error }));
      toast.error("Registration failed", { description: error });
    }
  }, [walletAddress, state, getContracts, publicClient]);

  // [Agent-Generated] Set reverse record (address -> name resolution).
  const setReverseRecord = useCallback(
    async (name: string) => {
      if (!walletAddress) {
        toast.error("No wallet connected");
        return;
      }

      try {
        const { reverseRegistrar } = await getContracts();

        // Estimate gas first
        const gasEstimate = await publicClient.estimateContractGas({
          address: ENS_REVERSE_REGISTRAR,
          abi: REVERSE_REGISTRAR_ABI,
          functionName: "setName",
          args: [name],
          account: walletAddress as `0x${string}`,
        });

        const hash = await reverseRegistrar.write.setName([name], {
          account: walletAddress as `0x${string}`,
          gas: gasEstimate + BigInt(10000), // Add 10k gas buffer
        });

        toast.loading("Setting reverse record...", { id: "reverse" });
        // Wait up to 5 minutes for transaction confirmation with 2s polling
        await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 300_000,
          pollingInterval: 2_000,
        });
        toast.success("Reverse record set!", { id: "reverse" });
      } catch (err) {
        const error =
          err instanceof Error
            ? err.message
            : "Failed to set reverse record";
        toast.error("Reverse record failed", { description: error });
      }
    },
    [walletAddress, getContracts, publicClient]
  );

  // [Agent-Generated] Reset registration state.
  const reset = useCallback(() => {
    setState({
      status: "idle",
      label: null,
      commitment: null,
      secret: null,
      price: null,
      duration: 31536000,
      waitTimeRemaining: 0,
      txHash: null,
      error: null,
    });
  }, []);

  return {
    state,
    checkAvailability,
    getPrice,
    commitRegistration,
    completeRegistration,
    setReverseRecord,
    reset,
  };
};
