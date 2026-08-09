const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:8787";

export interface Pair {
  pairId: number;
  base: string;
  quote: string;
  tickSize: string;
  lotSize: string;
}

export interface BookLevel {
  price: string;
  qty: string;
}

export interface BookDepth {
  pairId: number;
  bestBid: string | null;
  bestAsk: string | null;
  bids: BookLevel[];
  asks: BookLevel[];
}

export interface Trade {
  price: string;
  qty: string;
  takerIsBid: number;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  timestamp: number;
}

export interface Candle {
  bucket: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
}

export interface IndexedOrder {
  orderId: string;
  pairId: number;
  isBid: boolean;
  price: string;
  qty: string;
  remaining: string;
  status: "open" | "filled" | "canceled";
  placedTx: string;
  placedAt: number;
  updatedAt: number;
}

export interface RecentOrder {
  orderId: string;
  owner: string;
  isBid: boolean;
  price: string;
  qty: string;
  status: "open" | "filled" | "canceled";
  placedTx: string;
  placedAt: number;
}

export interface Fill {
  orderId: string;
  maker: string;
  taker: string;
  price: string;
  qty: string;
  fee: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  timestamp: number;
}

export interface ReserveSnapshot {
  blockNumber: number;
  timestamp: number;
  totalAssets: string;
  totalSupply: string;
  sharePrice1e18: string;
}

export interface ReserveApy {
  apyPct: number | null;
  dataPoints?: number;
  elapsedHours?: number;
  series: ReserveSnapshot[];
  note: string;
}

export interface Stats {
  tradeCount: number;
  totalVolume: number | null;
  totalFees: number | null;
  openOrders: number;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${INDEXER_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`indexer request failed: ${path} (${res.status})`);
  return res.json();
}

export const indexer = {
  pairs: () => fetchJson<Pair[]>("/api/pairs"),
  book: (pairId: number) => fetchJson<BookDepth>(`/api/book/${pairId}`),
  trades: (pairId: number, limit = 50) => fetchJson<Trade[]>(`/api/trades/${pairId}?limit=${limit}`),
  candles: (pairId: number, interval = "1m", limit = 200) =>
    fetchJson<Candle[]>(`/api/candles/${pairId}?interval=${interval}&limit=${limit}`),
  ordersByOwner: (owner: string) => fetchJson<IndexedOrder[]>(`/api/orders/${owner}`),
  recentOrders: (pairId: number, limit = 20) => fetchJson<RecentOrder[]>(`/api/orders/recent/${pairId}?limit=${limit}`),
  fillsByOwner: (owner: string, limit = 50) => fetchJson<Fill[]>(`/api/fills/${owner}?limit=${limit}`),
  reserveApy: () => fetchJson<ReserveApy>("/api/reserve/apy"),
  stats: (pairId?: number) => fetchJson<Stats>(`/api/stats${pairId !== undefined ? `?pairId=${pairId}` : ""}`),
};
