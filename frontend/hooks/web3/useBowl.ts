// [AGENT-GENERATED]
// [Agent-Generated] Bowl state + SessionFactory integration.
import { useState, useCallback } from "react";
import type { Coin, UseBowlParams } from "@/types/bowl.types";
import { useSessionFactory } from "@/hooks/web3/useSessionFactory";

export const useBowl = ({ selectedGame, selectedMode }: UseBowlParams) => {
  const [betAmount, setBetAmount] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [coins, setCoins] = useState<Coin[]>([]);

  const {
    createSession,
    createRpsClone,
    setRpsImplementation,
    txState,
    resetTxState,
  } = useSessionFactory();

  const quickAmounts = [
    { label: "0.001", value: "0.001" },
    { label: "0.01", value: "0.01" },
    { label: "0.05", value: "0.05" },
    { label: "0.1", value: "0.1" },
  ];

  const handleQuickAmount = useCallback((amount: string) => {
    setBetAmount(amount);
  }, []);


  const handleBet = useCallback(async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      return;
    }

    // [Agent-Generated] Reset any previous transaction status before submitting.
    resetTxState();

    try {
      // [Agent-Generated] Execute SessionFactory transaction based on the selected mode.
      const result = await createSession({
        gameId: selectedGame,
        betAmount,
      });

      // [Agent-Generated] Notify backend of the new session for tracking.
      try {
        await fetch("/api/session-factory/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: result.sessionId,
            txHash: result.hash,
            gameId: selectedGame,
            mode: selectedMode,
            betAmount,
          }),
        });
      } catch (error) {
        // [Agent-Generated] Backend tracking is best-effort for MVP.
        console.error("No se pudo registrar la sesion:", error);
      }
    } catch (error) {
      // [Agent-Generated] Contract errors are handled in the SessionFactory hook.
      console.error("Error al crear la sesion:", error);
    } finally {
      // [Agent-Generated] Keep the coin-drop animation independent from chain timing.
      setIsAnimating(true);
      const coinId = Date.now();
      setCoins((prev) => [...prev, { id: coinId, amount: betAmount }]);

      setTimeout(() => {
        setCoins((prev) => prev.filter((coin) => coin.id !== coinId));
        setIsAnimating(false);
      }, 1000);
    }
  }, [
    betAmount,
    createSession,
    resetTxState,
    selectedGame,
    selectedMode,
  ]);

  const handleMaxBet = useCallback(() => {
    setBetAmount("0.1");
  }, []);

  const isBetValid = betAmount && parseFloat(betAmount) > 0;

  return {
    betAmount,
    setBetAmount,
    isAnimating,
    coins,
    quickAmounts,
    handleQuickAmount,
    handleBet,
    handleMaxBet,
    isBetValid,
    txState,
    createRpsClone,
    setRpsImplementation,
    resetTxState,
  };
};
