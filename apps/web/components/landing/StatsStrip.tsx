"use client";

import { useEffect, useRef, useState } from "react";

// SIMULATED: placeholder targets until Phase 4's /api/stats replaces these
// with real aggregates from the indexer (volume, trade count, Reserve TVL, spread).
const TARGETS = { volume: 1284650, trades: 4211, tvl: 512400, spreadBps: 3.5 };

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(target * easeOutQuad(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

function fmtUsd(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const volume = useCountUp(TARGETS.volume, active);
  const trades = useCountUp(TARGETS.trades, active);
  const tvl = useCountUp(TARGETS.tvl, active);
  const spread = useCountUp(TARGETS.spreadBps, active);

  return (
    <section ref={ref} className="mx-auto mt-7 max-w-[1280px] px-[30px]">
      <div className="grid grid-cols-2 border-y border-ink-line lg:grid-cols-4">
        <div className="py-[22px] pr-6">
          <div className="mb-2.5 font-mono text-[11px] tracking-[0.1em] text-ink-faint">24H VOLUME</div>
          <div className="font-mono text-[30px] font-bold tracking-[-0.02em]">{fmtUsd(volume)}</div>
        </div>
        <div className="border-l border-ink-line py-[22px] px-6">
          <div className="mb-2.5 font-mono text-[11px] tracking-[0.1em] text-ink-faint">TRADES SETTLED</div>
          <div className="font-mono text-[30px] font-bold tracking-[-0.02em]">
            {Math.round(trades).toLocaleString("en-US")}
          </div>
        </div>
        <div className="border-l border-ink-line py-[22px] px-6">
          <div className="mb-2.5 font-mono text-[11px] tracking-[0.1em] text-ink-faint">RESERVE TVL</div>
          <div className="font-mono text-[30px] font-bold tracking-[-0.02em]">{fmtUsd(tvl)}</div>
        </div>
        <div className="border-l border-ink-line py-[22px] pl-6">
          <div className="mb-2.5 font-mono text-[11px] tracking-[0.1em] text-ink-faint">AVG SPREAD</div>
          <div className="font-mono text-[30px] font-bold tracking-[-0.02em] text-bid">
            {spread.toFixed(1)} bps
          </div>
        </div>
      </div>
    </section>
  );
}
