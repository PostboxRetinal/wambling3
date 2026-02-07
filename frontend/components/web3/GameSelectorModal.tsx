"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";

export type GameMode = "onchain" | "onsite";

export type GameSelection = {
  id: string;
  mode: GameMode;
};

// [Agent-Generated] Contract-aligned game options for UI selection.
const GAME_OPTIONS = [
  {
    id: "coinflip",
    label: "Coin Flip",
    description: "Apuesta rápida al cara o sello.",
    mode: "onchain" as const,
  },
  {
    id: "rps",
    label: "Rock • Paper • Scissors",
    description: "Piedra, papel o tijera en la cadena.",
    mode: "onchain" as const,
  },
  {
    id: "chess",
    label: "Chess",
    description: "Partida on-site con árbitro.",
    mode: "onsite" as const,
  },
  {
    id: "checkers",
    label: "Checkers",
    description: "Damas on-site con árbitro.",
    mode: "onsite" as const,
  },
];

type GameSelectorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: GameSelection) => void;
};

export const GameSelectorModal = ({
  open,
  onOpenChange,
  onSelect,
}: GameSelectorModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Selecciona el tipo de juego</DialogTitle>
          <DialogDescription>
            Elige un juego para iniciar la sesión.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {GAME_OPTIONS.map((game) => (
            <Button
              key={game.id}
              type="button"
              variant="outline"
              className="w-full justify-between border-border-primary bg-bg-tertiary text-text-primary hover:bg-primary/10"
              onClick={() => onSelect({ id: game.id, mode: game.mode })}
            >
              <span className="flex flex-col items-start">
                <span className="font-semibold">{game.label}</span>
                <span className="text-xs text-text-tertiary">
                  {game.description}
                </span>
              </span>
              <span className="text-xs text-text-secondary">
                {game.mode === "onchain" ? "On-chain" : "On-site"}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};