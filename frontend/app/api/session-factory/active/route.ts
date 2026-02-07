// [Agent-Generated] Backend endpoint to list active sessions from SessionFactory.
import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import {
  assertSessionFactoryAddress,
  SESSION_FACTORY_ABI,
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
} from "@/lib/contracts/sessionFactory";

export async function GET() {
  try {
    // [Agent-Generated] Initialize public client for read-only contract calls.
    const publicClient = createPublicClient({
      chain: SESSION_FACTORY_CHAIN,
      transport: http(SESSION_FACTORY_RPC_URL),
    });

    // [Agent-Generated] Fetch active sessions from the contract.
    const sessions = (await publicClient.readContract({
      address: assertSessionFactoryAddress(),
      abi: SESSION_FACTORY_ABI,
      functionName: "getActiveSessions",
    })) as unknown[];

    return NextResponse.json({
      ok: true,
      data: {
        sessions,
        count: sessions.length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo obtener las sesiones activas.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
