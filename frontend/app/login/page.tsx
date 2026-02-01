import { LoginForm } from "@/components/auth/LoginForm";
import { DiceIcon } from "@/components/ui/DiceIcon";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-primary p-4">
      <div className="text-center">
        <h1 className="mb-4 flex items-center justify-center gap-3 text-6xl font-bold text-primary">
          <DiceIcon className="h-14 w-14" /> Wambling3
        </h1>
        <p className="text-xl text-text-primary">
          Apuestas en juegos de mesa con <span className="font-semibold text-primary">crypto</span>
        </p>
      </div>

      <LoginForm />
    </main>
  );
}
