// Mobile counterpart to apps/web/lib/indexer.ts — same indexer REST API (already open-CORS,
// see packages/indexer/src/server.ts), just read through Expo's env-var convention
// (EXPO_PUBLIC_*) instead of Next's (NEXT_PUBLIC_*).
const INDEXER_URL = process.env.EXPO_PUBLIC_INDEXER_URL ?? "http://localhost:8787";

export type ProtocolStats = {
  volume24h: string;
  trades24h: number;
  tvl: string;
  avgSpreadBps: number;
};

export async function fetchStats(pairId?: string): Promise<ProtocolStats> {
  const url = new URL("/api/stats", INDEXER_URL);
  if (pairId) url.searchParams.set("pairId", pairId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`indexer /api/stats failed: ${res.status}`);
  return res.json();
}

export async function fetchReserveApy(): Promise<{ apy: number }> {
  const res = await fetch(new URL("/api/reserve/apy", INDEXER_URL).toString());
  if (!res.ok) throw new Error(`indexer /api/reserve/apy failed: ${res.status}`);
  return res.json();
}
