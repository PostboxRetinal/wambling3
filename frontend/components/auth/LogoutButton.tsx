"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = usePrivy();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada", {
        description: "Hasta pronto",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión", {
        description:
          error instanceof Error ? error.message : "Intenta de nuevo",
      });
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="border-border-primary bg-bg-tertiary text-text-primary hover:bg-primary-dark"
    >
      Cerrar sesión
    </Button>
  );
}
