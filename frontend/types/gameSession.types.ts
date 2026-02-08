import type { Hex, TransactionReceipt } from "viem";

export type PlayerSnapshot = {
  address: `0x${string}`;
  joined: boolean;
  stake: string;
};

export type SessionSnapshot = {
  sessionId: string;
  players: PlayerSnapshot[];
  stake?: string;
  sessionState?: number;
  creator?: `0x${string}` | null;
  opponent?: `0x${string}` | null;
  winner?: `0x${string}` | null;
};

export type ActionState = {
  status: "idle" | "signing" | "pending" | "confirmed" | "failed";
  hash: Hex | null;
  error: string | null;
  receipt: TransactionReceipt | null;
};

export type UseGameSessionParams = {
  sessionId: string;
};
