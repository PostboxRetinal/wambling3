import "@/styles/globals.css";
import { Web3Provider } from "./web3-provider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Web3Provider>{children}</Web3Provider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
