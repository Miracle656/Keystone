"use client";

import Link from "next/link";
import { useBook } from "@/lib/hooks/useMarketData";
import { formatPrice, formatQty } from "@/lib/format";
import type { BookLevel } from "@/lib/indexer";

type LevelWithCum = BookLevel & { cum: number };

function withCumulative(levels: BookLevel[]): LevelWithCum[] {
  let running = 0;
  return levels.map((l) => {
    running += Number(l.qty);
    return { ...l, cum: running };
  });
}

function LadderRows({ levels, side, maxCum }: { levels: LevelWithCum[]; side: "bid" | "ask"; maxCum: number }) {
  const color = side === "bid" ? "text-bid" : "text-ask";
  const barColor = side === "bid" ? "rgba(47,191,113,0.12)" : "rgba(229,72,77,0.12)";

  return (
    <>
      {levels.map((l) => (
        <div key={l.price} className="relative grid cursor-pointer grid-cols-3 px-3.5 py-[3px] font-mono text-[11.5px] hover:bg-[#14171E]">
          <div className="absolute inset-y-0 right-0" style={{ width: `${Math.min(94, (l.cum / maxCum) * 94)}%`, background: barColor }} />
          <span className={`relative ${color}`}>{formatPrice(l.price)}</span>
          <span className="relative text-right text-[#B8BDC7]">{formatQty(l.qty)}</span>
          <span className="relative text-right text-[#6A7280]">{formatQty(l.cum.toString())}</span>
        </div>
      ))}
    </>
  );
}

export function Ladder({ pairId }: { pairId: number }) {
  const { data: book, isLoading } = useBook(pairId);

  const bidsCum = withCumulative(book?.bids.slice(0, 11) ?? []);
  const asksCumAsc = withCumulative(book?.asks.slice(0, 11) ?? []);
  const asksDisplay = [...asksCumAsc].reverse();

  const maxCum = Math.max(1, bidsCum[bidsCum.length - 1]?.cum ?? 0, asksCumAsc[asksCumAsc.length - 1]?.cum ?? 0);

  const mid = book?.bestBid && book?.bestAsk ? (BigInt(book.bestBid) + BigInt(book.bestAsk)) / 2n : null;
  const spreadBps =
    book?.bestBid && book?.bestAsk ? (((Number(book.bestAsk) - Number(book.bestBid)) / Number(book.bestBid)) * 10000).toFixed(1) : null;

  return (
    <div className="flex min-h-0 flex-col border-r border-[#1C2028] bg-[#0C0E13]">
      <div className="font-mono flex flex-none gap-3.5 border-b border-[#1C2028] px-3.5 py-3 text-[11px] font-semibold">
        <span className="text-ink">Order Book</span>
        <Link href="/transparency" className="text-[#6A7280] hover:text-ink">
          Trades
        </Link>
      </div>
      <div className="font-mono grid flex-none grid-cols-3 px-3.5 py-2 text-[9.5px] tracking-[0.06em] text-[#6A7280]">
        <span>PRICE(EURC)</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TOTAL</span>
      </div>

      {isLoading ? (
        <div className="px-3.5 py-8 text-center text-[12px] text-[#6A7280]">Loading book…</div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-hidden">
            <LadderRows levels={asksDisplay} side="ask" maxCum={maxCum} />
          </div>

          <div className="flex flex-none items-center justify-between border-y border-[#262A33] bg-[#12141A] px-3.5 py-2">
            {mid !== null ? (
              <>
                <span className="font-mono text-[16px] font-bold text-bid">{formatPrice(mid)}</span>
                <span className="font-mono text-[10px] text-gold">
                  ◆ MID · {spreadBps ?? "—"} bps
                </span>
              </>
            ) : (
              <span className="font-mono text-[11.5px] text-[#6A7280]">No mid — book is thin</span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <LadderRows levels={bidsCum} side="bid" maxCum={maxCum} />
            {bidsCum.length === 0 && asksDisplay.length === 0 && (
              <div className="px-3.5 py-6 text-center text-[12px] text-[#6A7280]">No resting orders</div>
            )}
          </div>

          <div className="font-mono flex flex-none items-center justify-between border-t border-[#1C2028] px-3.5 py-[9px] text-[9px] text-[#6A7280]">
            <span>
              <span className="text-gold">▮</span> YOUR ORDERS
            </span>
            <Link href="/transparency" className="hover:text-ink">
              VERIFY →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
