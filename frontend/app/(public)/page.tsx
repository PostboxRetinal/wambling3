import Link from "next/link";
import { DiceIcon } from "@/components/common/DiceIcon";
import { Button } from "@/components/ui/button";

export default function PublicHomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-bg-primary via-bg-secondary to-bg-tertiary overflow-hidden">
      {/* [Agent-Generated] Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-dark/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-4 max-w-5xl mx-auto text-center">
        {/* [Agent-Generated] Logo badge */}
        <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-linear-to-r from-primary/30 via-primary-dark/30 to-primary/30 border-2 border-primary/50 backdrop-blur-md shadow-2xl shadow-primary/20 animate-pulse">
          <DiceIcon className="h-10 w-10 text-primary animate-spin-slow" />
          <span className="text-base md:text-lg font-black bg-linear-to-r from-primary via-white to-primary bg-clip-text text-transparent uppercase tracking-widest">
            Web3 Gaming Platform
          </span>
        </div>

        {/* [Agent-Generated] Main hero heading */}
        <div className="space-y-6 mt-4">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-text-primary leading-tight mb-8">
            Wambling3
          </h1>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-text-primary leading-tight">
            Apuesta.{" "}
            <span className="bg-linear-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent animate-gradient">
              Gana.
            </span>
          </h2>

          <p className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary">
            Sin Límites.
          </p>

          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-text-secondary leading-relaxed mt-8">
            Apuestas reales en crypto.
          </p>
        </div>

        {/* [Agent-Generated] CTA button */}
        <div className="flex flex-col items-center gap-4 mt-12">
          <Button
            asChild
            size="lg"
            className="h-16 px-12 text-xl font-bold bg-linear-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker transition-all duration-300 shadow-2xl hover:shadow-primary/50 hover:scale-105 transform"
          >
            <Link href="/login">
              Empieza ya 🎲
            </Link>
          </Button>
        </div>
      </div>

      {/* [Agent-Generated] Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-bg-primary to-transparent pointer-events-none" />
    </main>
  );
}
