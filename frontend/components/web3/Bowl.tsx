"use client";

// [Agent-Generated] SessionFactory-powered bowl experience.
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { useBowl } from "@/hooks/web3/useBowl";
import { useGameSession } from "@/hooks/web3/useGameSession";
import {
  GameSelectorModal,
} from "@/components/web3/GameSelectorModal";
import {
  SESSION_FACTORY_CHAIN,
} from "@/lib/contracts/sessionFactory";
import type { GameId, GameSelection } from "@/types/game.types";
import { useWalletBalance } from "@/hooks/web3/useWallet";
import { formatEther } from "viem";
import { useRouter, useSearchParams } from "next/navigation";

// [Agent-Generated] Map UI selection to contract game types.
const GAME_LABELS: Record<string, string> = {
  coinflip: "Coin Flip",
  rps: "Rock • Paper • Scissors",
};

export const Bowl = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedGame = (searchParams.get("game") ?? "coinflip") as GameId;
  const sessionParam = searchParams.get("session") ?? "";
  const selectedGameLabel = GAME_LABELS[selectedGame] ?? "Coin Flip";
  const selectedMode = "offchain";
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const {
    betAmount,
    setBetAmount,
    isAnimating,
    coins,
    quickAmounts,
    handleQuickAmount,
    handleBet,
    isBetValid,
    txState,
  } = useBowl({ selectedGame, selectedMode });

  // [Agent-Generated] Local session input + player UX state.
  const [flowMode, setFlowMode] = useState<"create" | "join">("create");
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [copiedSession, setCopiedSession] = useState(false);

  const {
    snapshot,
    isLoading: isSessionLoading,
    error: sessionError,
    refresh,
    joinOnsite,
    actionState,
    resetActionState,
  } = useGameSession({
    sessionId: sessionIdInput,
  });

  const { balance, isLoading: isBalanceLoading } = useWalletBalance();
  const balanceNum = balance ? parseFloat(balance) : 0;
  const hasBalance = !!balance && !Number.isNaN(balanceNum);
  const betAmountNum = betAmount ? parseFloat(betAmount) : 0;
  const isOverBalance = !!betAmount && hasBalance && betAmountNum > balanceNum;
  const isSubmitting =
    txState.status === "signing" || txState.status === "pending";
  const canBet =
    isBetValid && !isAnimating && !isSubmitting && hasBalance && !isOverBalance;
  const hasLiveStake = Boolean(snapshot?.stake);
  const hasBidInput = betAmountNum > 0;
  const isLive = hasLiveStake || hasBidInput;

  const formatAddress = (addr?: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const stakeEth = useMemo(() => {
    if (!snapshot?.stake) return "";
    try {
      return formatEther(BigInt(snapshot.stake));
    } catch {
      return "";
    }
  }, [snapshot?.stake]);

  const joinAmount = stakeEth || betAmount;

  const isJoinSubmitting =
    actionState.status === "signing" || actionState.status === "pending";

  const canJoinOnsite = !!sessionIdInput && !!joinAmount && !isJoinSubmitting;

  const handleMaxBetWithBalance = () => {
    if (!hasBalance) return;
    setBetAmount(balance ?? "");
  };

  const handleBetWithBalance = () => {
    if (!canBet || flowMode !== "create") return;
    handleBet();
  };

  const handleCopySession = async () => {
    if (!sessionIdInput) return;
    await navigator.clipboard.writeText(sessionIdInput);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };


  const handleJoinSession = async () => {
    if (canJoinOnsite) {
      await joinOnsite({ betAmount: stakeEth || joinAmount });
    }
  };

  const handleSelectGame = ({ id, mode }: GameSelection) => {
    router.push(`/home/bowl?game=${id}&mode=${mode}`);
    setIsGameModalOpen(false);
  };

  // [Agent-Generated] Contract sessions currently support 2 players only.
  const jugadores = ["Jugador 1", "Jugador 2"];

  const playerSlots = useMemo(() => {
    const slots = [0, 1];
    if (!snapshot) {
      return slots.map((index) => ({ index, address: null }));
    }

    const onsiteAddresses = [
      snapshot.creator ?? null,
      snapshot.opponent ?? null,
    ];
    return slots.map((index) => ({
      index,
      address: onsiteAddresses[index],
    }));
  }, [snapshot]);

  useEffect(() => {
    // [Agent-Generated] Auto-fill the session input when a new session is created.
    if (txState.sessionId) {
      setSessionIdInput(txState.sessionId);
      setFlowMode("join");
      refresh();
    }
  }, [refresh, txState.sessionId]);

  useEffect(() => {
    // [Agent-Generated] Honor invite links that include a session param.
    if (sessionParam) {
      setSessionIdInput(sessionParam);
      setFlowMode("join");
    }
  }, [sessionParam]);

  useEffect(() => {
    // [Agent-Generated] Refresh session data when the address or mode changes.
    if (sessionIdInput) {
      refresh();
    }
  }, [refresh, sessionIdInput, selectedMode]);

  return (
    <div className="space-y-4">
      <Card className="border-border-primary bg-linear-to-br from-bg-secondary to-bg-tertiary backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-text-primary relative z-10">
                Bowl
              </h3>
              <p className="text-sm text-text-secondary">
                {selectedGameLabel} · Off-chain
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-border-primary bg-bg-tertiary text-text-primary hover:bg-primary/10"
              onClick={() => setIsGameModalOpen(true)}
            >
              Cambiar juego
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
              style={{
                animation: "coinDrop 1s ease-in-out forwards",
              }}
            >
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-2xl flex items-center justify-center animate-spin">
                <span className="text-xs font-bold text-yellow-900">
                  {coin.amount}
                </span>
              </div>
            </div>
          ))}

          <div className="flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {jugadores.map((jugador, idx) => {
                const positions = [
                  {
                    top: "10%",
                    left: "70%",
                    transform: "translate(-50%, -50%)",
                  },
                  {
                    top: "70%",
                    right: "5%",
                    transform: "translate(50%, -50%)",
                  },
                  {
                    bottom: "65%",
                    left: "5%",
                    transform: "translate(-50%, 50%)",
                  },
                  {
                    top: "70%",
                    left: "5%",
                    transform: "translate(-50%, -50%)",
                  },
                ];

                return (
                  <div
                    key={idx}
                    className="absolute z-20 transition-all duration-500 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]"
                    style={{
                      ...positions[idx],
                      animationDelay: `${idx * 150}ms`,
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-linear-to-b from-bg-tertiary via-bg-secondary to-primary/20 border-4 border-primary/40 shadow-xl flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[10px] text-text-tertiary font-semibold leading-tight">
                          {jugador}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="relative z-10 w-32 h-32 rounded-full bg-linear-to-b from-bg-tertiary via-bg-secondary to-primary/20 border-8 border-primary/40 shadow-2xl flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-linear-to-b from-primary/30 to-primary/10 border-4 border-primary/30 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-text-tertiary font-bold">BOWL</p>
                    <p className="text-[10px] text-text-tertiary/60">
                      {jugadores.length} jugadores
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* [Agent-Generated] Create vs join switch to avoid accidental session creation. */}
          <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
              Accion
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={flowMode === "create" ? "default" : "outline"}
                onClick={() => setFlowMode("create")}
                className="border-border-primary"
              >
                Crear sesion
              </Button>
              <Button
                type="button"
                variant={flowMode === "join" ? "default" : "outline"}
                onClick={() => setFlowMode("join")}
                className="border-border-primary"
              >
                Unirme a sesion
              </Button>
            </div>
            <p className="text-xs text-text-tertiary">
              {'Usa "Unirme" si ya tienes el ID de invitacion.'}
            </p>
          </div>

          {/* [Agent-Generated] Player lobby with temporary names. */}
          <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {isLive && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                  <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                    Jugadores
                  </p>
                </div>
                <p className="text-sm text-text-secondary">
                  {snapshot?.players.length ?? 0}/2 conectados
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isSessionLoading}
                className="border-border-primary bg-bg-tertiary text-text-primary hover:bg-primary/10"
              >
                {isSessionLoading ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {playerSlots.map((slot) => (
                  <div
                    key={slot.index}
                    className="rounded-lg border border-border-primary bg-bg-secondary/70 p-3"
                  >
                    <p className="text-xs text-text-tertiary uppercase tracking-wider">
                      {slot.index === 0 ? "Jugador 1" : "Jugador 2"}
                    </p>
                    <p className="text-sm text-text-primary font-mono">
                      {slot.address
                        ? formatAddress(slot.address)
                        : "Esperando jugador"}
                    </p>
                  </div>
                ))}
            </div>

            {sessionError && (
              <p className="text-xs text-red-500">{sessionError}</p>
            )}
          </div>

          {/* [Agent-Generated] Session address + invite controls. */}
          <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
              Invitar jugador
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-secondary">
                ID de sesion
              </label>
              <div className="flex gap-2">
                <Input
                  value={sessionIdInput}
                  onChange={(e) => {
                    if (flowMode !== "join") return;
                    setSessionIdInput(e.target.value);
                    resetActionState();
                  }}
                  readOnly={flowMode !== "join"}
                  placeholder="ID de sesion"
                  className="flex-1 text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                <Button
                  variant="outline"
                  onClick={handleCopySession}
                  disabled={!sessionIdInput}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  {copiedSession ? "Copiado" : "Copiar"}
                </Button>
              </div>
              <p className="text-xs text-text-tertiary">
                Comparte este ID con el otro jugador para que se una.
              </p>
            </div>

          </div>

          {flowMode === "join" && (
            <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-4">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Unirse a partida off-chain
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Apuesta requerida (ETH)
                </label>
                <Input
                  value={joinAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={!!stakeEth}
                  placeholder={stakeEth || "0.0"}
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                {stakeEth && (
                  <p className="text-xs text-text-tertiary">
                    Stake requerido: {stakeEth} ETH (debe igualarse)
                  </p>
                )}
              </div>

              <Button
                onClick={handleJoinSession}
                disabled={!canJoinOnsite}
                className="w-full"
              >
                {isJoinSubmitting ? "Uniendote..." : "Unirme a la sesion"}
              </Button>

              <div className="rounded-lg border border-border-primary bg-bg-secondary/60 p-3 space-y-1">
                <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                  Estado de jugada
                </p>
                <p className="text-sm text-text-secondary">
                  Estado: {actionState.status}
                </p>
                {actionState.hash && (
                  <p className="text-xs text-text-tertiary break-all">
                    Tx: {actionState.hash}
                  </p>
                )}
                {actionState.error && (
                  <p className="text-xs text-red-500">{actionState.error}</p>
                )}
              </div>
            </div>
          )}

          {/* [Agent-Generated] Transaction inputs and contract controls. */}
          {flowMode === "create" && (
            <div className="mt-2 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Cantidad de Apuesta (ETH)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max={hasBalance ? balanceNum : undefined}
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.000"
                    className="flex-1 text-lg font-bold bg-bg-tertiary border-border-primary text-text-primary"
                  />
                  <Button
                    onClick={handleMaxBetWithBalance}
                    variant="outline"
                    disabled={!hasBalance}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    MAX
                  </Button>
                </div>
                {isBalanceLoading && (
                  <p className="text-xs text-text-tertiary">
                    Cargando balance...
                  </p>
                )}
                {!isBalanceLoading && !hasBalance && (
                  <p className="text-xs text-text-tertiary">
                    Conecta tu wallet para validar el balance.
                  </p>
                )}
                {isOverBalance && (
                  <p className="text-xs text-red-500">
                    El monto supera tu balance disponible.
                  </p>
                )}
                {hasBalance && !isOverBalance && (
                  <p className="text-xs text-text-tertiary">
                    Balance disponible: {balance} ETH
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quick) => (
                  <Button
                    key={quick.value}
                    onClick={() => handleQuickAmount(quick.value)}
                    variant="outline"
                    disabled={
                      hasBalance && parseFloat(quick.value) > balanceNum
                    }
                    className="border-border-primary hover:border-primary/50 hover:bg-primary/10 text-text-primary"
                  >
                    {quick.label}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleBetWithBalance}
                disabled={!canBet}
                className="w-full h-14 text-lg font-bold bg-linear-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker transition-all duration-300 shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnimating || isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {txState.status === "signing"
                      ? "Firmando..."
                      : txState.status === "pending"
                        ? "Confirmando..."
                        : "Apostando..."}
                  </span>
                ) : (
                  `Apostar ${betAmount || "0"} ETH`
                )}
              </Button>

              {/* [Agent-Generated] Live transaction status + receipt metadata. */}
              <div className="rounded-lg border border-border-primary bg-bg-tertiary/40 p-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                  Estado de transaccion
                </p>
                <p className="text-sm text-text-secondary">
                  Red activa: {SESSION_FACTORY_CHAIN.name}
                </p>
                <p className="text-sm text-text-secondary">
                  Estado: {txState.status}
                </p>
                {txState.estimatedGas !== null && (
                  <p className="text-sm text-text-secondary">
                    Gas estimado: {txState.estimatedGas.toString()}
                  </p>
                )}
                {txState.hash && (
                  <p className="text-xs text-text-tertiary break-all">
                    Tx: {txState.hash}
                  </p>
                )}
                {txState.sessionId && (
                  <p className="text-xs text-text-tertiary break-all">
                    Sesion: {txState.sessionId}
                  </p>
                )}
                {txState.error && (
                  <p className="text-xs text-red-500">{txState.error}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <GameSelectorModal
        open={isGameModalOpen}
        onOpenChange={setIsGameModalOpen}
        onSelect={handleSelectGame}
      />
    </div>
  );
};
