"use client";

import { useQuery } from "@tanstack/react-query";
import { indexer } from "@/lib/indexer";

export function usePairs() {
  return useQuery({ queryKey: ["pairs"], queryFn: indexer.pairs, staleTime: 60_000 });
}

export function useBook(pairId: number) {
  return useQuery({
    queryKey: ["book", pairId],
    queryFn: () => indexer.book(pairId),
    refetchInterval: 2000,
  });
}

export function useTrades(pairId: number, limit = 50) {
  return useQuery({
    queryKey: ["trades", pairId, limit],
    queryFn: () => indexer.trades(pairId, limit),
    refetchInterval: 3000,
  });
}

export function useCandles(pairId: number, interval: string, limit = 200) {
  return useQuery({
    queryKey: ["candles", pairId, interval, limit],
    queryFn: () => indexer.candles(pairId, interval, limit),
    refetchInterval: 5000,
  });
}

export function useOrdersByOwner(owner: string | undefined) {
  return useQuery({
    queryKey: ["orders", owner],
    queryFn: () => indexer.ordersByOwner(owner!),
    enabled: !!owner,
    refetchInterval: 3000,
  });
}

export function useFillsByOwner(owner: string | undefined) {
  return useQuery({
    queryKey: ["fills", owner],
    queryFn: () => indexer.fillsByOwner(owner!),
    enabled: !!owner,
    refetchInterval: 5000,
  });
}

export function useReserveApy() {
  return useQuery({ queryKey: ["reserve-apy"], queryFn: indexer.reserveApy, refetchInterval: 10_000 });
}

export function useStats(pairId?: number) {
  return useQuery({ queryKey: ["stats", pairId], queryFn: () => indexer.stats(pairId), refetchInterval: 5000 });
}

/** Derives 24h last/change/high/low/volume from hourly candles — the indexer has no
 * dedicated 24h-rollup endpoint, and 24 buckets is cheap enough to just compute client-side.
 *
 * The indexer only returns buckets that actually had a trade, so "the last 24 buckets it
 * returned" can silently be weeks old on a quiet testnet pair — that previously got mislabeled
 * as "24H VOLUME"/"24H TRADES" on Transparency, showing real-but-stale totals as if they were
 * from the last day. Filtering by real elapsed time here means a quiet last 24h honestly renders
 * as zero instead of borrowing whatever old activity happens to be the most recent. */
export function use24hStats(pairId: number) {
  return useQuery({
    queryKey: ["24h-stats", pairId],
    queryFn: async () => {
      const candles = await indexer.candles(pairId, "1h", 24);
      if (candles.length === 0) return null;

      const cutoff = Math.floor(Date.now() / 1000) - 86_400;
      const recent = candles.filter((c) => c.bucket >= cutoff);
      const lastKnown = candles[candles.length - 1].close;

      if (recent.length === 0) {
        return { last: lastKnown, changePct: 0, high: lastKnown, low: lastKnown, volume: 0, tradeCount: 0 };
      }

      const first = recent[0];
      const last = recent[recent.length - 1];
      const high = Math.max(...recent.map((c) => c.high));
      const low = Math.min(...recent.map((c) => c.low));
      const volume = recent.reduce((sum, c) => sum + c.volume, 0);
      const tradeCount = recent.reduce((sum, c) => sum + c.tradeCount, 0);
      const changePct = first.open === 0 ? 0 : ((last.close - first.open) / first.open) * 100;
      return { last: last.close, changePct, high, low, volume, tradeCount };
    },
    refetchInterval: 15_000,
  });
}

export function useRecentOrders(pairId: number, limit = 20) {
  return useQuery({
    queryKey: ["recent-orders", pairId, limit],
    queryFn: () => indexer.recentOrders(pairId, limit),
    refetchInterval: 3000,
  });
}
