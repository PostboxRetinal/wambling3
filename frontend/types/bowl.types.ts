import type { GameId, GameMode } from "@/types/game.types";

export type Coin = {
  id: number;
  amount: string;
};

export type UseBowlParams = {
  selectedGame: GameId;
  selectedMode: GameMode;
};
