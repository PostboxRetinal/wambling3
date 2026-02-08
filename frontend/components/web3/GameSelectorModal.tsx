"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { GameSelectorModalProps } from "@/types/ui.types";

// [Agent-Generated] Contract-aligned game options for UI selection.
const GAME_OPTIONS = [
  {
    id: "rps",
    label: "Rock • Paper • Scissors",
    mode: "offchain" as const,
  },
];

export const GameSelectorModal = ({
  open,
  onOpenChange,
  onSelect,
}: GameSelectorModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select game type</DialogTitle>
          <DialogDescription>
            Choose a game to start the session.
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
              </span>
            </Button>
          ))}

          <DialogDescription className="mt-4 text-sm text-text-secondary italic text-center">
            more games coming soon...
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
};