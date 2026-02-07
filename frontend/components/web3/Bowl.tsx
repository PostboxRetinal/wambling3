"use client";

import { Card, CardContent, CardHeader } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { useBowl } from "@/hooks/web3/useBowl";
import { useWalletBalance } from "@/hooks/web3/useWallet";

export const Bowl = () => {
  const {
    betAmount,
    setBetAmount,
    isAnimating,
    coins,
    quickAmounts,
    handleQuickAmount,
    handleBet,
    isBetValid,
  } = useBowl();

  const { balance, isLoading: isBalanceLoading } = useWalletBalance();
  const balanceNum = balance ? parseFloat(balance) : 0;
  const hasBalance = !!balance && !Number.isNaN(balanceNum);
  const betAmountNum = betAmount ? parseFloat(betAmount) : 0;
  const isOverBalance = !!betAmount && hasBalance && betAmountNum > balanceNum;
  const canBet = isBetValid && !isAnimating && hasBalance && !isOverBalance;

  const formatMaxBet = (value: number) =>
    value.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

  const handleMaxBetWithBalance = () => {
    if (!hasBalance) return;
    setBetAmount(formatMaxBet(balanceNum));
  };

  const handleBetWithBalance = () => {
    if (!canBet) return;
    handleBet();
  };

  const jugadores = ["Jugador 1", "Jugador 2", "Jugador 3", "Jugador 4"];

  return (
    <div className="space-y-4">
      <Card className="border-border-primary bg-linear-to-br from-bg-secondary to-bg-tertiary backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        <CardHeader>
          <h3 className="text-2xl font-bold text-text-primary relative z-10">
            Bowl
          </h3>
          <p className="text-sm text-text-secondary">Coloca tu apuesta</p>
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
              {isAnimating ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Apostando...
                </span>
              ) : (
                `Apostar ${betAmount || "0"} ETH`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
