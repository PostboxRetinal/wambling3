import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { DiceIcon } from "@/components/ui/DiceIcon";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border-primary bg-bg-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <DiceIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">Wambling3</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
