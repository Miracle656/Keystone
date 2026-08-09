"use client";

import { useTrades } from "@/lib/hooks/useMarketData";
import { useRecentOrders } from "@/lib/hooks/useMarketData";
import { formatPrice, formatQty, timeAgo } from "@/lib/format";
import { arcTestnet } from "@/lib/wagmi";
import { USDC_EURC_PAIR_ID } from "@/lib/addresses";

type FeedRow = { kind: string; color: string; detail: string; tx: string; timestamp: number };

function short(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function EventFeed() {
  const pairId = Number(USDC_EURC_PAIR_ID);
  const { data: trades } = useTrades(pairId, 12);
  const { data: orders } = useRecentOrders(pairId, 12);

  const rows: FeedRow[] = [
    ...(trades ?? []).map((t) => ({
      kind: "TradeExecuted",
      color: "#2fbf71",
      detail: `${formatPrice(t.price)} · ${formatQty(t.qty)} ${t.takerIsBid ? "buy" : "sell"}`,
      tx: t.txHash,
      timestamp: t.timestamp,
    })),
    ...(orders ?? []).map((o) => ({
      kind: o.status === "canceled" ? "OrderCanceled" : "OrderPlaced",
      color: "#e7b25a",
      detail: `${o.isBid ? "BUY" : "SELL"} limit @ ${formatPrice(o.price)}`,
      tx: o.placedTx,
      timestamp: o.placedAt,
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 16);

  return (
    <div className="rounded-2xl border border-ink-line bg-panel">
      <div className="flex items-center justify-between border-b border-ink-line px-[22px] py-4">
        <span className="font-mono text-[11px] tracking-[0.14em] text-ink-soft">LIVE PROTOCOL EVENTS</span>
        <span className="font-mono text-[10px] text-bid">● STREAMING</span>
      </div>
      <div>
        {rows.length === 0 && (
          <div className="font-mono px-[22px] py-8 text-center text-[12px] text-ink-faint">
            No on-chain activity indexed yet — place a real order on Trade to see it here.
          </div>
        )}
        {rows.map((ev, i) => (
          <div
            key={`${ev.tx}-${i}`}
            className="font-mono grid grid-cols-[130px_1fr_150px_80px] items-center gap-2 border-b border-ink-line-soft px-[22px] py-[11px] text-[11.5px]"
          >
            <span style={{ color: ev.color }} className="font-bold">
              {ev.kind}
            </span>
            <span className="text-ink-muted">{ev.detail}</span>
            <a
              href={`${arcTestnet.blockExplorers.default.url}/tx/${ev.tx}`}
              target="_blank"
              rel="noreferrer"
              className="text-right text-[11px] text-gold hover:text-ink"
            >
              {short(ev.tx)}
            </a>
            <span className="text-right text-ink-faint">{timeAgo(ev.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
