import "@/styles/globals.css";
import { Toaster } from "sonner";
import { ClientProviders } from "./providers/client-providers";

// [Agent-Generated] ClientProviders is a Client Component with mount guards to prevent SSR errors.

export const metadata = {
  title: "Wambling3",
  description: "A web3 social media platform",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ClientProviders>{children}</ClientProviders>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
