import { CircleClient } from "@circle-fin/w3s-pw";

export const circle = new CircleClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

export async function createArcWallet() {
  // Ajusta parámetros según la API de Circle que uses
  const wallet = await circle.createWallet({
    blockchains: ["ETH"],
  });
  return wallet;
}