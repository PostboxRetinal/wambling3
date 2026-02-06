"use client";

import { Card, CardContent, CardHeader } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { useBowl } from "@/hooks/web3/useBowl";

export const Bowl = () => {
  const {
    betAmount,
    setBetAmount,
    isAnimating,
    coins,
    quickAmounts,
    handleQuickAmount,
    handleBet,
    handleMaxBet,
    isBetValid,
  } = useBowl();

  return (
    <div className="space-y-4">
      <Card className="border-border-primary bg-gradient-to-br from-bg-secondary to-bg-tertiary backdrop-blur-sm relative overflow-hidden">
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-2xl flex items-center justify-center animate-spin">
                <span className="text-xs font-bold text-yellow-900">
                  {coin.amount}
                </span>
              </div>
            </div>
          ))}

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-bg-tertiary via-bg-secondary to-primary/20 border-8 border-primary/40 shadow-2xl flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-primary/30 to-primary/10 border-4 border-primary/30 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-text-tertiary font-semibold">
                    BOWL
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Cantidad de Apuesta (ETH)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.000"
                  className="flex-1 text-lg font-bold bg-bg-tertiary border-border-primary text-text-primary"
                />
                <Button
                  onClick={handleMaxBet}
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  MAX
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quick) => (
                <Button
                  key={quick.value}
                  onClick={() => handleQuickAmount(quick.value)}
                  variant="outline"
                  className="border-border-primary hover:border-primary/50 hover:bg-primary/10 text-text-primary"
                >
                  {quick.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleBet}
              disabled={isAnimating || !isBetValid}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker transition-all duration-300 shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
