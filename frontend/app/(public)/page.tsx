import Link from "next/link";
import { DiceIcon } from "@/components/ui/DiceIcon";

export default function PublicHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary text-text-primary p-4">
      <h1 className="flex items-center justify-center gap-3 text-5xl font-bold text-primary">
        <DiceIcon className="h-12 w-12" /> Wambling3
      </h1>

      <p className="max-w-md text-center text-text-secondary">
        Apuesta en juegos de mesa tradicionales usando crypto,
        sin fricción y sin efectivo.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-xl border border-border-primary bg-bg-secondary px-6 py-3 font-semibold text-text-primary transition-colors hover:bg-primary-dark"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/home"
          className="rounded-xl border border-border-primary bg-primary-dark px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-darker"
        >
          Ir al lobby
        </Link>
      </div>
    </main>
  );
}
