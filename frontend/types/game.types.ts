export type GameId = "coinflip" | "rps";

export type GameMode = "offchain";

export type GameSelection = {
  id: GameId;
  mode: GameMode;
};
