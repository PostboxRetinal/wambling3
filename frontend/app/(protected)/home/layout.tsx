import { WalletBalance } from "@/components/web3";
import { Card, CardContent, CardHeader } from "@/components/ui";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className=" bg-gradient-to-br from-bg-primary via-bg-primary to-bg-secondary">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="animate-fade-in">
              <WalletBalance />
            </div>

            <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
              <CardContent className="space-y-2">
                <h3 className="text-lg font-semibold text-text-primary">
                  Estadísticas
                </h3>
                <div className="flex justify-between items-center p-2 bg-bg-tertiary/50 rounded-lg">
                  <span className="text-sm text-text-secondary">
                    Total Apostado
                  </span>
                  <span className="text-lg font-bold text-primary">
                    0.000 ETH
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-bg-tertiary/50 rounded-lg">
                  <span className="text-sm text-text-secondary">
                    Total Ganado
                  </span>
                  <span className="text-lg font-bold text-green-400">
                    0.000 ETH
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-bg-tertiary/50 rounded-lg">
                  <span className="text-sm text-text-secondary">
                    Partidas Jugadas
                  </span>
                  <span className="text-lg font-bold text-text-primary">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">{children}</div>
        </div>
      </div>
    </main>
  );
}
