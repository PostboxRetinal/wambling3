import { StartBowl } from "@/components/web3";
import { Card, CardContent, CardHeader } from "@/components/ui";

export default function LobbyPage() {
  return (
    <>
      {/* Games Section */}
      <StartBowl />

      {/* Recent Activity */}
      <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm mt-6">
        <CardHeader>
          <h3 className="text-xl font-bold text-text-primary">
            Actividad Reciente
          </h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎲</div>
            <p className="text-text-secondary">
              No hay actividad reciente
            </p>
            <p className="text-sm text-text-tertiary mt-2">
              ¡Comienza a jugar para ver tu historial aquí!
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
