"use client";

import { useState } from "react";
import Image from "next/image";
import { useReserveTVL, useReserveFeesCaptured } from "@/lib/hooks/useReserveStats";
import { useReserveApy } from "@/lib/hooks/useMarketData";
import { CHAINS } from "@/lib/hooks/useUnifiedBalance";
import { useRouterModal } from "@/components/app/RouterModalProvider";
import { VaultMoveModal } from "@/components/earn/VaultMoveModal";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

// The other five are the PRD §5 roadmap's regional-FX pairs (Phase 3 — Pairs) — real product
// direction, but no contract exists for any of them yet. Shown so the vision is visible, with
// zero fabricated numbers and a disabled deposit button, never presented as if they're live.
const COMING_SOON = [
  { pair: "USDC / USDT", strat: "Stable Reserve", quote: "T", color: "#26A17B" },
  { pair: "USDC / BRLA", strat: "FX Reserve · Brazilian real", quote: "R$", color: "#1F9D63" },
  { pair: "USDC / JPYC", strat: "FX Reserve · Japanese yen", quote: "¥", color: "#C0574E" },
  { pair: "USDC / MXNB", strat: "FX Reserve · Mexican peso", quote: "$", color: "#4B54E6" },
  { pair: "USDC / PHPC", strat: "FX Reserve · Philippine peso", quote: "₱", color: "#2A6FDB" },
];

export function VaultTable({ currency }: { currency: CurrencyCode }) {
  const tvl = useReserveTVL();
  const { data: fees } = useReserveFeesCaptured();
  const { data: apy } = useReserveApy();
  const { open } = useRouterModal();
  const [moveOpen, setMoveOpen] = useState(false);

  return (
    <div>
      <div className="font-mono grid grid-cols-[2.3fr_1.2fr_1fr_0.9fr_0.9fr_118px] px-[18px] py-3 text-[10px] tracking-[0.08em] text-ink-soft">
        <span>VAULT</span>
        <span>DEPOSIT FROM</span>
        <span className="text-right">TVL</span>
        <span className="text-right">FEES CAPTURED</span>
        <span className="text-right">APY</span>
        <span />
      </div>

      <div className="mb-2 grid grid-cols-[2.3fr_1.2fr_1fr_0.9fr_0.9fr_118px] items-center rounded-xl border border-gold bg-[rgba(231,178,90,0.08)] px-[18px] py-4">
        <div className="flex items-center gap-3.5">
          <div className="flex flex-none">
            <Image src="/brand/usdc.svg" alt="" width={30} height={30} className="rounded-full border-2 border-panel" />
            <Image src="/brand/eurc.svg" alt="" width={30} height={30} className="-ml-2 rounded-full border-2 border-panel" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">USDC / EURC</span>
              <span className="font-mono rounded border border-gold px-[5px] py-[1px] text-[9px] text-gold">FLAGSHIP</span>
            </div>
            <div className="font-mono mt-0.5 text-[11px] text-ink-soft">Keystone Reserve · real on-chain FX quoting</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex flex-none">
            {CHAINS.map((c) => (
              <div
                key={c.id}
                className="relative -ml-1.5 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border-2 border-panel first:ml-0"
                style={c.logoBg ? { background: c.logoBg } : undefined}
              >
                <Image src={c.logo} alt={c.name} fill sizes="20px" className={c.logoBg ? "object-contain p-[3px]" : "object-cover"} />
              </div>
            ))}
          </div>
          <span className="font-mono text-[10px] text-ink-soft">any chain</span>
        </div>
        <div className="font-mono text-right text-[14px] font-semibold text-ink">{tvl === null ? "…" : formatCurrency(tvl, currency)}</div>
        <div className="font-mono text-right text-[14px] text-bid">{fees === undefined ? "…" : formatCurrency(fees.totalFeeCaptured, currency)}</div>
        <div className="font-mono text-right text-[16px] font-bold text-bid">
          {apy?.apyPct === null || apy?.apyPct === undefined ? "…" : `${apy.apyPct >= 0 ? "" : ""}${apy.apyPct.toFixed(1)}%`}
        </div>
        <button
          onClick={() => open("deposit", "VAULT")}
          className="font-mono justify-self-end rounded-lg bg-gold px-5 py-2.5 text-[12px] font-bold text-cream transition-colors hover:bg-gold-bright"
        >
          DEPOSIT
        </button>
      </div>

      <button onClick={() => setMoveOpen(true)} className="font-mono mb-6 mt-1 block text-[11px] text-gold">
        ⇄ MOVE FUNDS BETWEEN TRADING &amp; VAULT →
      </button>
      <VaultMoveModal open={moveOpen} onClose={() => setMoveOpen(false)} />

      {COMING_SOON.map((v) => (
        <div
          key={v.pair}
          className="mb-2 grid grid-cols-[2.3fr_1.2fr_1fr_0.9fr_0.9fr_118px] items-center rounded-xl border border-ink-line-soft bg-[rgba(245,241,230,0.03)] px-[18px] py-4 opacity-60"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex flex-none">
              <Image src="/brand/usdc.svg" alt="" width={30} height={30} className="rounded-full border-2 border-parchment" />
              <div
                className="font-mono -ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-parchment text-[10px] font-bold text-white"
                style={{ background: v.color }}
              >
                {v.quote}
              </div>
            </div>
            <div>
              <span className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">{v.pair}</span>
              <div className="font-mono mt-0.5 text-[11px] text-ink-soft">{v.strat}</div>
            </div>
          </div>
          <div className="font-mono text-[10px] text-ink-soft">—</div>
          <div className="font-mono text-right text-[13px] text-ink-soft">—</div>
          <div className="font-mono text-right text-[13px] text-ink-soft">—</div>
          <div className="font-mono text-right text-[13px] text-ink-soft">—</div>
          <button disabled className="font-mono justify-self-end rounded-lg border border-ink-line px-4 py-2.5 text-[11px] font-bold text-ink-soft">
            COMING SOON
          </button>
        </div>
      ))}
    </div>
  );
}
