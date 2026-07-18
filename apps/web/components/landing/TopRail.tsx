"use client";

import { useEffect, useState } from "react";

// SIMULATED: the ticking mid price is a client-side placeholder until the
// Phase 4 indexer's /api/book/:pair feed replaces it with the real on-chain mid.
export function TopRail() {
  const [mid, setMid] = useState(1.1512);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setMid((m) => Math.max(1.148, Math.min(1.154, m + (Math.random() - 0.5) * 0.0006)));
      timer = setTimeout(tick, 1500 + Math.random() * 1700);
    };
    timer = setTimeout(tick, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-between border-b border-ink-line px-[30px] py-2 font-mono text-[11px] tracking-[0.04em] text-ink-faint">
      <span>KEYSTONE PROTOCOL — ARC TESTNET · CHAIN 5042002</span>
      <span className="flex gap-[22px]">
        <span>
          USDC/EURC <b className="font-bold text-ink">{mid.toFixed(4)}</b>
        </span>
        <span>
          SPREAD <b className="font-bold text-ink">3.5bps</b>
        </span>
        <span className="text-bid">● MATCHING ON-CHAIN</span>
      </span>
    </div>
  );
}
