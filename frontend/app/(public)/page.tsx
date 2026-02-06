import Link from "next/link";
import { DiceIcon } from "@/components/common/DiceIcon";
import { Button } from "@/components/ui/button";

export default function PublicHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary text-text-primary p-4">
      <h1 className="flex items-center justify-center gap-3 text-5xl font-bold text-primary">
        <DiceIcon className="h-12 w-12" /> Wambling3
      </h1>

      <p className="max-w-md text-center text-text-secondary">
        Apuesta en juegos de mesa tradicionales usando crypto, sin fricción y
        sin efectivo.
      </p>

      <div className="flex gap-4">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-border-primary bg-bg-secondary text-text-primary hover:bg-primary-dark"
        >
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    </main>
  );
}
