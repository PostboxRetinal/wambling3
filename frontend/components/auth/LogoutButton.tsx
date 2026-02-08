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
      toast.success("Signed out", {
        description: "See you soon",
      });
      router.replace("/login");
      window.location.assign("/login");
    } catch (error) {
      toast.error("Failed to sign out", {
        description:
          error instanceof Error ? error.message : "Please try again",
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
      Sign out
    </Button>
  );
}
