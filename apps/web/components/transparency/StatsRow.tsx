"use client";

import { use24hStats, useBook } from "@/lib/hooks/useMarketData";
import { useReserveTVL } from "@/lib/hooks/useReserveStats";
import { useReserveApy } from "@/lib/hooks/useMarketData";
import { formatUnits } from "viem";
import { USDC_EURC_PAIR_ID } from "@/lib/addresses";

function fmtUsd(n: number | null | undefined) {
  if (n === null || n === undefined) return "…";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function StatsRow() {
  const pairId = Number(USDC_EURC_PAIR_ID);
  const { data: day } = use24hStats(pairId);
  const { data: book } = useBook(pairId);
  const tvl = useReserveTVL();
  const { data: apy } = useReserveApy();

  const bestBid = book?.bestBid ? Number(formatUnits(BigInt(book.bestBid), 6)) : null;
  const bestAsk = book?.bestAsk ? Number(formatUnits(BigInt(book.bestAsk), 6)) : null;
  const spreadBps = bestBid && bestAsk ? ((bestAsk - bestBid) / ((bestAsk + bestBid) / 2)) * 10_000 : null;

  const tiles = [
    { label: "24H VOLUME", value: day ? fmtUsd(day.volume) : "…", color: "text-ink" },
    { label: "24H TRADES", value: day ? day.tradeCount.toLocaleString("en-US") : "…", color: "text-ink" },
    { label: "SPREAD", value: spreadBps === null ? "no live quotes" : `${spreadBps.toFixed(1)} bps`, color: "text-gold" },
    { label: "RESERVE TVL", value: fmtUsd(tvl), color: "text-ink" },
    { label: "RESERVE APY", value: apy?.apyPct == null ? "—" : `${apy.apyPct.toFixed(1)}%`, color: "text-bid" },
  ];

  return (
    <div className="mb-7 grid grid-cols-1 gap-0 rounded-2xl border border-ink-line bg-panel sm:grid-cols-5">
      {tiles.map((t, i) => (
        <div key={t.label} className={`px-[22px] py-[22px] ${i > 0 ? "border-t border-ink-line sm:border-l sm:border-t-0" : ""}`}>
          <div className="font-mono mb-2 text-[10px] tracking-[0.12em] text-ink-soft">{t.label}</div>
          <div className={`font-mono text-[22px] font-bold tracking-[-0.02em] ${t.color}`}>{t.value}</div>
        </div>
      ))}
    </div>
  );
}
