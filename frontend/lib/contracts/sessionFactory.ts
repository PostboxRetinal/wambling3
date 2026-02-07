// [Agent-Generated] Session factory config + helpers shared by client/server.
import type { Chain } from "viem";
import { isAddress } from "viem";
import {
  arbitrum,
  base,
  baseSepolia,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "viem/chains";
import sessionFactoryAbi from "@/contractABI.json";

// [Agent-Generated] ABI reference for contract reads/writes.
export const SESSION_FACTORY_ABI = sessionFactoryAbi;

// [Agent-Generated] Chain lookup to keep chain selection consistent.
const CHAIN_BY_ID: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [base.id]: base,
  [baseSepolia.id]: baseSepolia,
  [optimism.id]: optimism,
  [arbitrum.id]: arbitrum,
  [polygon.id]: polygon,
};

// [Agent-Generated] Public env configuration used across the app.
const rawChainId = process.env.NEXT_PUBLIC_SESSION_FACTORY_CHAIN_ID;
const parsedChainId = rawChainId ? Number(rawChainId) : sepolia.id;
export const SESSION_FACTORY_CHAIN_ID =
  Number.isFinite(parsedChainId) && parsedChainId > 0
    ? parsedChainId
    : sepolia.id;
export const SESSION_FACTORY_CHAIN =
  CHAIN_BY_ID[SESSION_FACTORY_CHAIN_ID] ?? sepolia;

export const SESSION_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_SESSION_FACTORY_ADDRESS ?? "";

export const SESSION_FACTORY_RPC_URL =
  process.env.NEXT_PUBLIC_SESSION_FACTORY_RPC_URL ||
  SESSION_FACTORY_CHAIN.rpcUrls.default.http[0];

// [Agent-Generated] Ensure the contract address is present and valid.
export const assertSessionFactoryAddress = (): `0x${string}` => {
  if (!isAddress(SESSION_FACTORY_ADDRESS)) {
    throw new Error(
      "SessionFactory address is missing or invalid. Set NEXT_PUBLIC_SESSION_FACTORY_ADDRESS.",
    );
  }
  return SESSION_FACTORY_ADDRESS as `0x${string}`;
};

// [Agent-Generated] UI identifiers for supported game types.
export type GameId = "coinflip" | "rps" | "chess" | "checkers";
export type GameMode = "onchain" | "onsite";

// [Agent-Generated] Enum alignment between UI and contracts.
export const GAME_TYPE_MAP: Record<GameId, number> = {
  coinflip: 0,
  rps: 1,
  chess: 0,
  checkers: 1,
};

// [Agent-Generated] Default on-chain session duration for MVP (seconds).
export const DEFAULT_SESSION_DURATION_SECONDS = 1800;
