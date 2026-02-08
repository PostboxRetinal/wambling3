// [Agent-Generated] Backend bridge to track SessionFactory submissions.
import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  type Hex,
} from "viem";
import {
  assertSessionFactoryAddress,
  SESSION_FACTORY_ABI,
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
} from "@/lib/contracts/sessionFactory";

export async function POST(request: Request) {
  try {
    // [Agent-Generated] Parse and validate incoming payload.
    const body = await request.json();
    const sessionId = body?.sessionId as string | undefined;
    const txHash = body?.txHash as string | undefined;
    const gameId = body?.gameId as string | undefined;
    const mode = body?.mode as string | undefined;
    const betAmount = body?.betAmount as string | undefined;

    if (sessionId && !/^[0-9]+$/.test(sessionId)) {
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
    const sessionInfoRaw: any = sessionId
      ? await publicClient
          .readContract({
            address: assertSessionFactoryAddress(),
            abi: SESSION_FACTORY_ABI,
            functionName: "sessionInfo",
            args: [BigInt(sessionId)],
          })
          .catch(() => null)
      : null;

    // [Agent-Generated] Normalize session info into JSON-safe fields.
    const sessionInfo = sessionInfoRaw
      ? {
          creator: sessionInfoRaw.creator ?? sessionInfoRaw[0],
          opponent: sessionInfoRaw.opponent ?? sessionInfoRaw[1],
          winner: sessionInfoRaw.winner ?? sessionInfoRaw[2],
          stake: String(sessionInfoRaw.stake ?? sessionInfoRaw[3]),
          gameType: Number(sessionInfoRaw.gameType ?? sessionInfoRaw[4]),
          state: Number(sessionInfoRaw.state ?? sessionInfoRaw[5]),
          createdAt: String(sessionInfoRaw.createdAt ?? sessionInfoRaw[6]),
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
