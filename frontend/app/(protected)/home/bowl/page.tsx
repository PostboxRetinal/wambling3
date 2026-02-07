"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bowl } from "@/components/web3";
import { Button } from "@/components/ui";
import {
  GameSelectorModal,
  type GameSelection,
} from "@/components/web3/GameSelectorModal";

export default function BowlPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = ({ id, mode }: GameSelection) => {
    router.push(`/home/bowl?game=${id}&mode=${mode}`);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="border-border-primary bg-bg-tertiary text-text-primary hover:bg-primary/10"
          onClick={() => setIsOpen(true)}
        >
          Cambiar juego
        </Button>
      </div>

      <Bowl />

      <GameSelectorModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onSelect={handleSelect}
      />
    </div>
  );
}
