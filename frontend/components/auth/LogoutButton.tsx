"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada", {
        description: "Hasta pronto"
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión", {
        description: error instanceof Error ? error.message : "Intenta de nuevo"
      });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-border-primary bg-bg-tertiary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-primary-dark"
    >
      Cerrar sesión
    </button>
  );
}
