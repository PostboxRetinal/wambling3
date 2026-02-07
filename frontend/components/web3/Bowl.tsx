"use client";

// [Agent-Generated] SessionFactory-powered bowl experience.
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { useBowl } from "@/hooks/web3/useBowl";
import { useGameSession } from "@/hooks/web3/useGameSession";
import {
  SESSION_FACTORY_CHAIN,
  type GameId,
  type GameMode,
} from "@/lib/contracts/sessionFactory";
import { useWalletBalance } from "@/hooks/web3/useWallet";
import { formatEther } from "viem";
import { useSearchParams } from "next/navigation";

// [Agent-Generated] Map UI selection to contract game types.
const GAME_LABELS: Record<string, string> = {
  coinflip: "Coin Flip",
  rps: "Rock • Paper • Scissors",
  chess: "Chess",
  checkers: "Checkers",
};

export const Bowl = () => {
  const searchParams = useSearchParams();
  const selectedGame = (searchParams.get("game") ?? "coinflip") as GameId;
  const selectedMode = (searchParams.get("mode") ?? "onchain") as GameMode;
  const selectedGameLabel = GAME_LABELS[selectedGame] ?? "Coin Flip";
  const {
    betAmount,
    setBetAmount,
    durationMinutes,
    setDurationMinutes,
    arbiterAddress,
    setArbiterAddress,
    isAnimating,
    coins,
    quickAmounts,
    handleQuickAmount,
    handleBet,
    isBetValid,
    txState,
    isDurationValid,
    isArbiterValid,
  } = useBowl({ selectedGame, selectedMode });

  // [Agent-Generated] Local session input + player UX state.
  const [sessionAddressInput, setSessionAddressInput] = useState("");
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [nonce, setNonce] = useState<`0x${string}` | "">("");
  const [copiedSession, setCopiedSession] = useState(false);

  const {
    snapshot,
    isLoading: isSessionLoading,
    error: sessionError,
    refresh,
    joinOnchain,
    revealOnchain,
    joinOnsite,
    actionState,
    resetActionState,
    generateNonce,
  } = useGameSession({
    sessionAddress: sessionAddressInput,
    mode: selectedMode,
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

  const formatMaxBet = (value: number) =>
    value.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

  const formatAddress = (addr?: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const minBetEth = useMemo(() => {
    if (!snapshot?.minBet) return "";
    try {
      return formatEther(BigInt(snapshot.minBet));
    } catch (error) {
      return "";
    }
  }, [snapshot?.minBet]);

  const stakeEth = useMemo(() => {
    if (!snapshot?.stake) return "";
    try {
      return formatEther(BigInt(snapshot.stake));
    } catch (error) {
      return "";
    }
  }, [snapshot?.stake]);

  const joinAmount =
    betAmount || (selectedMode === "onchain" ? minBetEth : stakeEth);

  const isJoinSubmitting =
    actionState.status === "signing" || actionState.status === "pending";

  const canJoinOnchain =
    selectedMode === "onchain" &&
    !!sessionAddressInput &&
    !!joinAmount &&
    selectedChoice !== null &&
    !!nonce &&
    !isJoinSubmitting;

  const canJoinOnsite =
    selectedMode === "onsite" &&
    !!sessionAddressInput &&
    !!joinAmount &&
    !isJoinSubmitting;

  const canReveal =
    selectedMode === "onchain" &&
    !!sessionAddressInput &&
    selectedChoice !== null &&
    !!nonce &&
    !isJoinSubmitting;

  const handleMaxBetWithBalance = () => {
    if (!hasBalance) return;
    setBetAmount(formatMaxBet(balanceNum));
  };

  const handleBetWithBalance = () => {
    if (!canBet) return;
    handleBet();
  };

  const handleCopySession = async () => {
    if (!sessionAddressInput) return;
    await navigator.clipboard.writeText(sessionAddressInput);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const handleGenerateNonce = () => {
    // [Agent-Generated] Always generate a fresh nonce for each commitment.
    const newNonce = generateNonce();
    setNonce(newNonce);
  };

  const handleJoinSession = async () => {
    if (selectedMode === "onchain" && canJoinOnchain) {
      await joinOnchain({
        betAmount: joinAmount,
        choice: selectedChoice as number,
        nonce: nonce as `0x${string}`,
      });
      return;
    }

    if (selectedMode === "onsite" && canJoinOnsite) {
      await joinOnsite({ betAmount: joinAmount });
    }
  };

  const handleRevealChoice = async () => {
    if (!canReveal) return;
    await revealOnchain({
      choice: selectedChoice as number,
      nonce: nonce as `0x${string}`,
    });
  };

  // [Agent-Generated] Contract sessions currently support 2 players only.
  const jugadores = ["Jugador 1", "Jugador 2"];

  const playerSlots = useMemo(() => {
    const slots = [0, 1];
    if (!snapshot) {
      return slots.map((index) => ({ index, address: null }));
    }

    if (selectedMode === "onchain") {
      return slots.map((index) => ({
        index,
        address: snapshot.players[index]?.address ?? null,
      }));
    }

    const onsiteAddresses = [snapshot.creator ?? null, snapshot.opponent ?? null];
    return slots.map((index) => ({
      index,
      address: onsiteAddresses[index],
    }));
  }, [selectedMode, snapshot]);

  const choiceLabels = useMemo<Record<number, string>>(() => {
    if (selectedGame === "coinflip") {
      return {
        1: "Heads",
        2: "Tails",
        3: "",
      };
    }
    return {
      1: "Rock",
      2: "Paper",
      3: "Scissors",
    };
  }, [selectedGame]);

  const resolvedResult = useMemo(() => {
    if (!snapshot || snapshot.resolution === undefined) return "";

    if (snapshot.resolution === 1 && snapshot.winner) {
      // [Agent-Generated] Winner resolution; derive visual result from winner choice when available.
      const winnerInfo = snapshot.players.find(
        (player) => player.address === snapshot.winner,
      );
      if (winnerInfo?.choice && choiceLabels[winnerInfo.choice]) {
        return choiceLabels[winnerInfo.choice];
      }
      return "Winner";
    }

    if (snapshot.resolution === 2) return "Draw";
    if (snapshot.resolution === 3) return "Cancel";
    return "";
  }, [choiceLabels, snapshot]);

  useEffect(() => {
    // [Agent-Generated] Auto-fill the session input when a new session is created.
    if (txState.sessionAddress) {
      setSessionAddressInput(txState.sessionAddress);
      refresh();
    }
  }, [refresh, txState.sessionAddress]);

  useEffect(() => {
    // [Agent-Generated] Refresh session data when the address or mode changes.
    if (sessionAddressInput) {
      refresh();
    }
  }, [refresh, sessionAddressInput, selectedMode]);

  return (
    <div className="space-y-4">
      <Card className="border-border-primary bg-linear-to-br from-bg-secondary to-bg-tertiary backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        <CardHeader>
          <h3 className="text-2xl font-bold text-text-primary relative z-10">
            Bowl
          </h3>
          <p className="text-sm text-text-secondary">
            {selectedGameLabel} · {selectedMode === "onchain" ? "On-chain" : "On-site"}
          </p>
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
                  { top: "10%", left: "70%", transform: "translate(-50%, -50%)" },
                  { top: "70%", right: "5%", transform: "translate(50%, -50%)" },
                  { bottom: "65%", left: "5%", transform: "translate(-50%, 50%)" },
                  { top: "70%", left: "5%", transform: "translate(-50%, -50%)" },
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

          {/* [Agent-Generated] Dynamic game visual for CoinFlip / RPS. */}
          {selectedMode === "onchain" && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-full border-4 border-primary/40 bg-linear-to-br from-bg-tertiary via-bg-secondary to-primary/20 shadow-xl flex items-center justify-center">
                <div
                  className={`w-24 h-24 rounded-full border-2 border-primary/40 flex items-center justify-center text-xl font-bold text-text-primary ${
                    isJoinSubmitting ? "animate-spin" : ""
                  }`}
                >
                  {resolvedResult || "?"}
                </div>
              </div>
              <p className="text-xs text-text-tertiary">
                {resolvedResult
                  ? `Resultado: ${resolvedResult}`
                  : "Esperando jugadas..."}
              </p>
            </div>
          )}

          {/* [Agent-Generated] Player lobby with temporary names. */}
          <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                  Jugadores
                </p>
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
              {playerSlots.map((slot) => {
                const slotKey = slot.address ?? `slot-${slot.index}`;
                return (
                  <div
                    key={slot.index}
                    className="rounded-lg border border-border-primary bg-bg-secondary/70 p-3"
                  >
                    <p className="text-xs text-text-tertiary uppercase tracking-wider">
                      {slot.index === 0 ? "Jugador 1" : "Jugador 2"}
                    </p>
                    <p className="text-sm text-text-primary font-mono">
                      {slot.address ? formatAddress(slot.address) : "Esperando jugador"}
                    </p>
                    <Input
                      value={playerNames[slotKey] ?? ""}
                      onChange={(e) =>
                        setPlayerNames((prev) => ({
                          ...prev,
                          [slotKey]: e.target.value,
                        }))
                      }
                      placeholder="Nombre temporal"
                      className="mt-2 text-sm bg-bg-tertiary border-border-primary text-text-primary"
                    />
                  </div>
                );
              })}
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
                Direccion de sesion
              </label>
              <div className="flex gap-2">
                <Input
                  value={sessionAddressInput}
                  onChange={(e) => {
                    setSessionAddressInput(e.target.value);
                    resetActionState();
                  }}
                  placeholder="0x..."
                  className="flex-1 text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                <Button
                  variant="outline"
                  onClick={handleCopySession}
                  disabled={!sessionAddressInput}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  {copiedSession ? "Copiado" : "Copiar"}
                </Button>
              </div>
              <p className="text-xs text-text-tertiary">
                Comparte esta direccion con el otro jugador para que se una.
              </p>
            </div>
          </div>

          {/* [Agent-Generated] Game action controls for join/reveal. */}
          {selectedMode === "onchain" && (
            <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-4">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Jugada on-chain
              </p>

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(choiceLabels).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={selectedChoice === Number(value) ? "default" : "outline"}
                    onClick={() => setSelectedChoice(Number(value))}
                    className="border-border-primary hover:border-primary/50"
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Nonce (para commitment)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value as `0x${string}`)}
                    placeholder="0x..."
                    className="flex-1 text-sm bg-bg-tertiary border-border-primary text-text-primary"
                  />
                  <Button
                    variant="outline"
                    onClick={handleGenerateNonce}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    Generar
                  </Button>
                </div>
                <p className="text-xs text-text-tertiary">
                  Guarda este nonce para poder revelar tu jugada.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Apuesta para unirte (ETH)
                </label>
                <Input
                  value={joinAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder={minBetEth || "0.0"}
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                {minBetEth && (
                  <p className="text-xs text-text-tertiary">
                    Minimo requerido: {minBetEth} ETH
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  onClick={handleJoinSession}
                  disabled={!canJoinOnchain}
                  className="flex-1"
                >
                  {isJoinSubmitting ? "Uniendote..." : "Unirme a la sesion"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRevealChoice}
                  disabled={!canReveal}
                  className="flex-1"
                >
                  {isJoinSubmitting ? "Revelando..." : "Revelar jugada"}
                </Button>
              </div>

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

          {selectedMode === "onsite" && (
            <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-4">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Unirse a partida on-site
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Apuesta requerida (ETH)
                </label>
                <Input
                  value={joinAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder={stakeEth || "0.0"}
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                {stakeEth && (
                  <p className="text-xs text-text-tertiary">
                    Stake requerido: {stakeEth} ETH
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
                <p className="text-xs text-text-tertiary">Cargando balance...</p>
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
                  Balance disponible: {formatMaxBet(balanceNum)} ETH
                </p>
              )}
            </div>

            {/* [Agent-Generated] On-chain sessions require a duration parameter. */}
            {selectedMode === "onchain" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Duracion (minutos)
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="30"
                  className="text-lg font-bold bg-bg-tertiary border-border-primary text-text-primary"
                />
                {!isDurationValid && (
                  <p className="text-xs text-red-500">
                    La duracion debe ser mayor a 0.
                  </p>
                )}
              </div>
            )}

            {/* [Agent-Generated] On-site sessions require an arbiter wallet. */}
            {selectedMode === "onsite" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Direccion del arbitro
                </label>
                <Input
                  value={arbiterAddress}
                  onChange={(e) => setArbiterAddress(e.target.value)}
                  placeholder="0x..."
                  className="text-lg font-bold bg-bg-tertiary border-border-primary text-text-primary"
                />
                {!isArbiterValid && (
                  <p className="text-xs text-red-500">
                    La direccion del arbitro es invalida.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quick) => (
                <Button
                  key={quick.value}
                  onClick={() => handleQuickAmount(quick.value)}
                  variant="outline"
                  disabled={hasBalance && parseFloat(quick.value) > balanceNum}
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
              {txState.sessionAddress && (
                <p className="text-xs text-text-tertiary break-all">
                  Sesion: {txState.sessionAddress}
                </p>
              )}
              {txState.error && (
                <p className="text-xs text-red-500">{txState.error}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
