"use client";

import { useState } from "react";
import { useReserveTVL, useReserveFeesCaptured, useYieldHistory, type YieldRange } from "@/lib/hooks/useReserveStats";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function StatsPanel({ currency }: { currency: CurrencyCode }) {
  const [range, setRange] = useState<YieldRange>("D");
  const tvl = useReserveTVL();
  const { data: fees } = useReserveFeesCaptured();
  const { data: bars } = useYieldHistory(range);

  const maxAbs = Math.max(0.000001, ...(bars ?? []).map((b) => Math.abs(b.deltaUsd)));

  return (
    <div className="mb-[30px] grid grid-cols-1 gap-[18px] md:grid-cols-[300px_1fr]">
      <div className="flex flex-col justify-center gap-6 rounded-2xl border border-ink-line bg-panel p-6">
        <div>
          <div className="font-mono mb-2 text-[10px] tracking-[0.12em] text-ink-soft">TOTAL VALUE LOCKED</div>
          <div className="font-mono text-[27px] font-bold tracking-[-0.02em] text-ink">
            {tvl === null ? "…" : formatCurrency(tvl, currency)}
          </div>
        </div>
        <div>
          <div className="font-mono mb-2 text-[10px] tracking-[0.12em] text-ink-soft">FEES CAPTURED (ALL TIME, REAL)</div>
          <div className="font-mono text-[27px] font-bold tracking-[-0.02em] text-bid">
            {fees === undefined ? "…" : formatCurrency(fees.totalFeeCaptured, currency)}
          </div>
          <div className="font-mono mt-1 text-[10px] text-ink-soft">
            {fees === undefined ? "" : `from ${fees.fillCount} real fill${fees.fillCount === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-line bg-panel px-6 py-5">
        <div className="mb-3.5 flex items-start justify-between">
          <div>
            <div className="font-mono mb-1.5 text-[10px] tracking-[0.12em] text-ink-soft">NAV GROWTH FROM CAPTURED VALUE</div>
            <div className="font-mono text-[13px] text-ink-muted">Real, from on-chain fills — a fresh testnet vault, so amounts are small.</div>
          </div>
          <div className="font-mono flex gap-0.5 overflow-hidden rounded-md border border-ink-line text-[11px]">
            {(["D", "W", "M"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 py-1.5"
                style={{ background: range === r ? "var(--color-ink)" : "transparent", color: range === r ? "var(--color-cream)" : "var(--color-ink-soft)" }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex h-24 items-end gap-[3px]">
          {(bars ?? Array.from({ length: 24 }, () => ({ deltaUsd: 0 }))).map((b, i) => {
            const h = Math.max(2, (Math.abs(b.deltaUsd) / maxAbs) * 100);
            return (
              <div
                key={i}
                className="flex-1 rounded-t-[2px]"
                style={{ height: `${h}%`, background: b.deltaUsd > 0 ? "var(--color-bid)" : b.deltaUsd < 0 ? "var(--color-ask)" : "var(--color-ink-line-soft)" }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
