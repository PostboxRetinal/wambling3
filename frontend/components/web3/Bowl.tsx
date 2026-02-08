"use client";

// [Agent-Generated] SessionFactory-powered bowl experience.
import { useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { useBowl } from "@/hooks/web3/useBowl";
import { useGameSession } from "@/hooks/web3/useGameSession";
import {
  SESSION_FACTORY_CHAIN,
} from "@/lib/contracts/sessionFactory";
import type { GameId } from "@/types/game.types";
import { useWalletBalance } from "@/hooks/web3/useWallet";
import { formatEther } from "viem";
import { useSearchParams } from "next/navigation";

export const Bowl = () => {
  const searchParams = useSearchParams();
  const selectedGame = "rps" as GameId;
  const sessionParam = searchParams.get("session") ?? "";
  const selectedMode = "offchain";
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
  const { wallets } = useWallets();
  const currentAddress = wallets[0]?.address ?? null;
  const balanceNum = balance ? parseFloat(balance) : 0;
  const hasBalance = !!balance && !Number.isNaN(balanceNum);
  const betAmountNum = betAmount ? parseFloat(betAmount) : 0;
  const isOverBalance = !!betAmount && hasBalance && betAmountNum > balanceNum;
  const isSubmitting =
    txState.status === "signing" || txState.status === "pending";
  const canBet =
    isBetValid && !isAnimating && !isSubmitting && hasBalance && !isOverBalance;

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

  const handleCloseSession = () => {
    setSessionIdInput("");
    setFlowMode("create");
    resetActionState();
  };

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

  const [localMove, setLocalMove] = useState<"rock" | "paper" | "scissors" | null>(
    null,
  );

  const resultText = useMemo(() => {
    if (!snapshot?.winner || !currentAddress) return "En curso";
    return snapshot.winner.toLowerCase() === currentAddress.toLowerCase()
      ? "Ganaste"
      : "Perdiste";
  }, [currentAddress, snapshot?.winner]);

  const roundInfo = useMemo(() => ({ current: 1, total: 3 }), []);

  const displaySessionId = useMemo(() => {
    if (!sessionIdInput) return "Sin sesión activa";
    if (sessionIdInput.length < 10) return sessionIdInput;
    return `${sessionIdInput.slice(0, 4)}..${sessionIdInput.slice(-3)}`;
  }, [sessionIdInput]);

  const rpsIcon = (move: "rock" | "paper" | "scissors" | null) => {
    switch (move) {
      case "rock":
        return (
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-xl border-2 border-gray-400">
            <span className="text-3xl">🪨</span>
          </div>
        );
      case "paper":
        return (
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl border-2 border-blue-300">
            <span className="text-3xl">📄</span>
          </div>
        );
      case "scissors":
        return (
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl border-2 border-red-400">
            <span className="text-3xl">✂️</span>
          </div>
        );
      default:
        return (
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-xl border-2 border-gray-300">
            <span className="text-3xl">❓</span>
          </div>
        );
    }
  };

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
                Piedra, Papel o Tijera
              </h3>
              <p className="text-sm text-text-secondary">
                Ronda off-chain · Listo para jugar
              </p>
            </div>
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

          {/* [Agent-Generated] Session ID with copy icon. */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold mb-1">
                ID de sesion
              </p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold text-text-primary">
                  {displaySessionId}
                </p>
                <button
                  onClick={handleCopySession}
                  disabled={!sessionIdInput}
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copiar ID completo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-text-secondary hover:text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                {copiedSession && (
                  <span className="text-xs text-green-500 font-semibold animate-pulse">
                    ¡Copiado!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* [Agent-Generated] Session status and controls. */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Estado de sesion
              </p>
              <p className="text-sm text-text-secondary">
                {isSessionLoading ? "Actualizando" : actionState.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isSessionLoading}
                className="border-border-primary"
              >
                {isSessionLoading ? "Actualizando..." : "Actualizar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseSession}
                className="border-border-primary"
              >
                Cerrar sesion
              </Button>
              <Button
                type="button"
                variant={flowMode === "join" ? "default" : "outline"}
                size="sm"
                onClick={() => setFlowMode("join")}
                className="border-border-primary"
              >
                Unirme a sesion
              </Button>
            </div>
          </div>

          {flowMode === "join" && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 p-4 rounded-xl border border-border-primary bg-bg-tertiary/40">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  ID de sesion para unirse
                </label>
                <Input
                  value={sessionIdInput}
                  onChange={(e) => {
                    setSessionIdInput(e.target.value);
                    resetActionState();
                  }}
                  placeholder="Pega el ID aqui"
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
              </div>
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
                    Stake requerido: {stakeEth} ETH
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleJoinSession}
                  disabled={!canJoinOnsite}
                  className="w-full"
                >
                  {isJoinSubmitting ? "Uniendote..." : "Unirme a la sesion"}
                </Button>
                {actionState.hash && (
                  <p className="text-xs text-text-tertiary break-all mt-2">
                    Tx: {actionState.hash}
                  </p>
                )}
                {actionState.error && (
                  <p className="text-xs text-red-500 mt-2">{actionState.error}</p>
                )}
              </div>
            </div>
          )}

          {/* [Agent-Generated] Game comparison area. */}
          <div className="mt-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl border border-border-primary bg-bg-secondary/70 p-4 text-center space-y-3">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Tu wallet
              </p>
              <p className="text-sm text-text-primary font-mono">
                {currentAddress ? formatAddress(currentAddress) : "Sin wallet"}
              </p>
              <div className="flex justify-center">{rpsIcon(localMove)}</div>
              <p className="text-xs text-text-tertiary">
                {localMove ? `Elegiste ${localMove}` : "Sin eleccion"}
              </p>
            </div>

            <div className="text-center text-3xl font-bold text-text-primary">VS</div>

            <div className="rounded-xl border border-border-primary bg-bg-secondary/70 p-4 text-center space-y-3">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Oponente
              </p>
              <p className="text-sm text-text-primary font-mono">
                {playerSlots[1]?.address
                  ? formatAddress(playerSlots[1].address)
                  : "Esperando jugador"}
              </p>
              <div className="flex justify-center">{rpsIcon(null)}</div>
              <p className="text-xs text-text-tertiary">Sin eleccion</p>
            </div>
          </div>

          {/* [Agent-Generated] Result and round info. */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-3xl font-bold text-text-primary">{resultText}</p>
            <p className="text-sm text-text-secondary">
              Ronda {roundInfo.current} de {roundInfo.total}
            </p>
          </div>

          {/* [Agent-Generated] RPS action buttons. */}
          <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4">
            <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold mb-3">
              Tu movimiento
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => setLocalMove("rock")}
                className="border-border-primary bg-bg-secondary/70 hover:bg-gradient-to-br hover:from-gray-600 hover:to-gray-800 hover:border-gray-400 transition-all flex flex-col items-center justify-center gap-2 py-4"
              >
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg border-2 border-gray-400">
                  <span className="text-2xl">🪨</span>
                </div>
                <span className="text-sm font-semibold">Piedra</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocalMove("paper")}
                className="border-border-primary bg-bg-secondary/70 hover:bg-gradient-to-br hover:from-blue-400 hover:to-blue-600 hover:border-blue-300 transition-all flex flex-col items-center justify-center gap-2 py-4"
              >
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-blue-300">
                  <span className="text-2xl">📄</span>
                </div>
                <span className="text-sm font-semibold">Papel</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocalMove("scissors")}
                className="border-border-primary bg-bg-secondary/70 hover:bg-gradient-to-br hover:from-red-500 hover:to-red-700 hover:border-red-400 transition-all flex flex-col items-center justify-center gap-2 py-4"
              >
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border-2 border-red-400">
                  <span className="text-2xl">✂️</span>
                </div>
                <span className="text-sm font-semibold">Tijera</span>
              </Button>
            </div>
          </div>

          {/* [Agent-Generated] Bet info + create session controls. */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Apuesta activa
              </p>
              <p className="text-sm text-text-secondary">
                Stake requerido: {stakeEth || "0.0"} ETH
              </p>
              <p className="text-sm text-text-secondary">
                Tu apuesta: {betAmount || "0"} ETH
              </p>
              {hasBalance && !isOverBalance && (
                <p className="text-xs text-text-tertiary">
                  Balance disponible: {balance} ETH
                </p>
              )}
              {isOverBalance && (
                <p className="text-xs text-red-500">
                  El monto supera tu balance disponible.
                </p>
              )}
              {sessionError && (
                <p className="text-xs text-red-500">{sessionError}</p>
              )}
            </div>

            {flowMode === "create" && (
              <div className="rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
