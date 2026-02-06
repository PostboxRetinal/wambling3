import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <Link href="/">
          <Button
            variant="ghost"
            className="text-text-secondary hover:text-text-primary hover:bg-bg-secondary -ml-2"
          >
            ← Volver
          </Button>
        </Link>
      </div>
      <LoginForm />
    </main>
  );
}
