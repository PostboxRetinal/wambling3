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
import type { GameId } from "@/types/game.types";

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

// [AGENT-GENERATED] UUIDv4 helpers for session IDs.
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuidV4 = (value: string): boolean => UUID_V4_REGEX.test(value);

export const generateUuidV4 = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  throw new Error("No se pudo generar UUIDv4 en este entorno.");
};

export const uuidToBytes16 = (uuid: string): `0x${string}` => {
  if (!isUuidV4(uuid)) {
    throw new Error("UUIDv4 invalido.");
  }
  const hex = uuid.replace(/-/g, "").toLowerCase();
  return `0x${hex}` as `0x${string}`;
};

export const bytes16ToUuid = (value: `0x${string}`): string => {
  const hex = value.replace(/^0x/i, "");
  if (hex.length !== 32) {
    throw new Error("bytes16 invalido.");
  }
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  if (!isUuidV4(uuid)) {
    throw new Error("UUIDv4 invalido.");
  }
  return uuid;
};

// [Agent-Generated] Ensure the contract address is present and valid.
export const assertSessionFactoryAddress = (): `0x${string}` => {
  if (!isAddress(SESSION_FACTORY_ADDRESS)) {
    throw new Error(
      "SessionFactory address is missing or invalid. Set NEXT_PUBLIC_SESSION_FACTORY_ADDRESS.",
    );
  }
  return SESSION_FACTORY_ADDRESS as `0x${string}`;
};

// [Agent-Generated] Enum alignment between UI and contracts.
export const GAME_TYPE_MAP: Record<GameId, number> = {
  coinflip: 0,
  rps: 1,
};
