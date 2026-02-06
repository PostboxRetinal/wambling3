"use client";

import { Card, CardContent, CardHeader } from "@/components/ui";
import { DiceIcon } from "@/components/common/DiceIcon";
import { useRouter } from "next/navigation";

export const StartBowl = () => {
  const router = useRouter();

  const handleNavigateToBowl = () => {
    router.push("/home/bowl");
  };

  return (
    <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-2xl font-bold text-text-primary">Bowl</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <div 
            onClick={handleNavigateToBowl}
            className="group relative overflow-hidden rounded-xl border border-border-primary bg-gradient-to-br from-bg-tertiary to-bg-secondary p-6 hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <DiceIcon className="w-12 h-12 text-primary mb-4 group-hover:rotate-12 transition-transform" />
              <h4 className="text-xl font-bold text-text-primary mb-2">
                Inicia un Juego
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  Apuesta y gana!
                </span>
                <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
