import { useState, useCallback } from "react";

interface Coin {
  id: number;
  amount: string;
}

export const useBowl = () => {
  const [betAmount, setBetAmount] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [coins, setCoins] = useState<Coin[]>([]);

  const quickAmounts = [
    { label: "0.001", value: "0.001" },
    { label: "0.01", value: "0.01" },
    { label: "0.05", value: "0.05" },
    { label: "0.1", value: "0.1" },
  ];

  const handleQuickAmount = useCallback((amount: string) => {
    setBetAmount(amount);
  }, []);

  const handleBet = useCallback(() => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      return;
    }

    setIsAnimating(true);
    const coinId = Date.now();
    setCoins((prev) => [...prev, { id: coinId, amount: betAmount }]);

    setTimeout(() => {
      setCoins((prev) => prev.filter((coin) => coin.id !== coinId));
      setIsAnimating(false);
    }, 1000);
  }, [betAmount]);

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
  };
};
