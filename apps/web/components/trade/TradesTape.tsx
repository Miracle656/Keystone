"use client";

import { useTrades } from "@/lib/hooks/useMarketData";
import { formatPrice, formatQty, timeAgo } from "@/lib/format";

export function TradesTape({ pairId }: { pairId: number }) {
  const { data: trades, isLoading } = useTrades(pairId, 30);

  return (
    <div className="flex h-full flex-col border border-ink-line bg-panel">
      <div className="border-b border-ink-line px-3 py-2.5 text-[11px] font-bold tracking-[0.1em] text-ink-faint">RECENT TRADES</div>
      <div className="flex justify-between px-3 pb-1 pt-2 font-mono text-[10.5px] tracking-[0.05em] text-ink-faint">
        <span>PRICE</span>
        <span>QTY</span>
        <span>TIME</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-3 py-8 text-center text-[12px] text-ink-faint">Loading trades…</div>
        ) : trades && trades.length > 0 ? (
          trades.map((t) => (
            <div key={`${t.txHash}-${t.logIndex}`} className="flex items-center justify-between px-3 py-1.5 font-mono text-[12px]">
              <span className={t.takerIsBid ? "text-ask" : "text-bid"}>{formatPrice(t.price)}</span>
              <span className="text-ink-muted">{formatQty(t.qty)}</span>
              <span className="text-ink-faint">{timeAgo(t.timestamp)}</span>
            </div>
          ))
        ) : (
          <div className="px-3 py-8 text-center text-[12px] text-ink-faint">No trades yet</div>
        )}
      </div>
    </div>
  );
}
