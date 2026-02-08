// [Agent-Generated] Backend bridge to track SessionFactory submissions.
import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  type Hex,
} from "viem";
import {
  assertSessionFactoryAddress,
  isUuidV4,
  SESSION_FACTORY_ABI,
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
  uuidToBytes16,
} from "@/lib/contracts/sessionFactory";
import type { SessionInfoRaw } from "@/types/sessionFactory.types";

export async function POST(request: Request) {
  try {
    // [Agent-Generated] Parse and validate incoming payload.
    const body = await request.json();
    const sessionId = body?.sessionId as string | undefined;
    const txHash = body?.txHash as string | undefined;
    const gameId = body?.gameId as string | undefined;
    const mode = body?.mode as string | undefined;
    const betAmount = body?.betAmount as string | undefined;

    if (sessionId && !isUuidV4(sessionId)) {
      return NextResponse.json(
        { ok: false, error: "Session ID invalido." },
        { status: 400 },
      );
    }

    if (txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { ok: false, error: "Tx hash invalido." },
        { status: 400 },
      );
    }

    // [Agent-Generated] Read chain state to confirm receipt and session.
    const publicClient = createPublicClient({
      chain: SESSION_FACTORY_CHAIN,
      transport: http(SESSION_FACTORY_RPC_URL),
    });

    const receipt = txHash
      ? await publicClient
          .getTransactionReceipt({ hash: txHash as Hex })
          .catch(() => null)
      : null;

    // [Agent-Generated] Try to read session info if the address is provided.
    const sessionInfoRaw = sessionId
      ? await publicClient
          .readContract({
            address: assertSessionFactoryAddress(),
            abi: SESSION_FACTORY_ABI,
            functionName: "sessionInfo",
            args: [uuidToBytes16(sessionId)],
          })
          .catch(() => null)
      : null;
    const typedSessionInfo = sessionInfoRaw as SessionInfoRaw | null;

    // [Agent-Generated] Normalize session info into JSON-safe fields.
    const sessionInfo = typedSessionInfo
      ? {
          creator: typedSessionInfo.creator ?? typedSessionInfo[0],
          opponent: typedSessionInfo.opponent ?? typedSessionInfo[1],
          winner: typedSessionInfo.winner ?? typedSessionInfo[2],
          stake: String(typedSessionInfo.stake ?? typedSessionInfo[3]),
          gameType: Number(typedSessionInfo.gameType ?? typedSessionInfo[4]),
          state: Number(typedSessionInfo.state ?? typedSessionInfo[5]),
          createdAt: String(typedSessionInfo.createdAt ?? typedSessionInfo[6]),
        }
      : null;

    return NextResponse.json({
      ok: true,
      data: {
        sessionId,
        txHash,
        gameId,
        mode,
        betAmount,
        receipt: receipt
          ? {
              status: receipt.status,
              blockNumber: receipt.blockNumber.toString(),
              transactionIndex: receipt.transactionIndex,
            }
          : null,
        sessionInfo,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo procesar el tracking.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
