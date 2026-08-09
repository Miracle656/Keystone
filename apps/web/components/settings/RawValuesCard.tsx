"use client";

import { useRawValues } from "@/lib/hooks/usePreferences";

export function RawValuesCard() {
  const [raw, setRaw] = useRawValues();

  return (
    <div className="mb-[18px] flex items-center justify-between rounded-2xl border border-ink-line bg-panel px-[22px] py-5">
      <div>
        <div className="font-mono text-[12px] font-bold text-ink">RAW VALUES</div>
        <div className="mt-1 text-[12px] text-ink-muted">Show token amounts (USDC / EURC) instead of display currency.</div>
      </div>
      <button
        onClick={() => setRaw(!raw)}
        role="switch"
        aria-checked={raw}
        className="relative h-[30px] w-[58px] flex-none cursor-pointer rounded-full border-[1.5px] p-0"
        style={{ background: "var(--color-parchment)", borderColor: raw ? "var(--color-gold)" : "var(--color-ink-line)" }}
      >
        <span
          className="absolute top-0.5 h-[22px] w-[22px] rounded-full transition-[left]"
          style={{ left: raw ? "30px" : "2px", background: raw ? "var(--color-gold)" : "var(--color-ink-soft)" }}
        />
      </button>
    </div>
  );
}
