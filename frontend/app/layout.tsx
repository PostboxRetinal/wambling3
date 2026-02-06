import "@/styles/globals.css";
import { PrivyProvider } from "./providers/privy-provider";
import { Web3Provider } from "./providers/web3-provider";
import { Toaster } from "sonner";

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
        <PrivyProvider>
          <Web3Provider>{children}</Web3Provider>
        </PrivyProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
