import type { GameSelection } from "@/types/game.types";

export type GameSelectorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: GameSelection) => void;
};
