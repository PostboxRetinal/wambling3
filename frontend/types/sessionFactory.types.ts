// [AGENT-GENERATED]
import type { Hex, TransactionReceipt } from "viem";
import type { GameId } from "@/types/game.types";

export type SessionFactoryTxStatus =
  | "idle"
  | "signing"
  | "pending"
  | "confirmed"
  | "failed";

export type SessionFactoryTxState = {
  status: SessionFactoryTxStatus;
  hash: Hex | null;
  error: string | null;
  receipt: TransactionReceipt | null;
  estimatedGas: bigint | null;
  sessionId: string | null;
  cloneAddress: string | null;
  action: "create-session" | "create-escrow" | null;
};

export type CreateSessionParams = {
  gameId: GameId;
  betAmount: string;
};

export type CreateRpsCloneParams = {
  refereeAddress: string;
};

export type SessionInfoRaw = readonly [
  string,
  string,
  string,
  bigint,
  bigint,
  bigint,
  bigint,
] & {
  creator?: string;
  opponent?: string;
  winner?: string;
  stake?: bigint;
  gameType?: bigint;
  state?: bigint;
  createdAt?: bigint;
};
