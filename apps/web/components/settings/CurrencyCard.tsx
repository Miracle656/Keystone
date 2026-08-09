"use client";

import { CURRENCIES, DEMO_RATES, type CurrencyCode } from "@/lib/currency";
import { useDisplayCurrency } from "@/lib/hooks/usePreferences";

export function CurrencyCard() {
  const [currency, setCurrency] = useDisplayCurrency();

  return (
    <div className="mb-[18px] rounded-2xl border border-ink-line bg-panel">
      <div className="border-b border-ink-line px-[22px] py-[18px]">
        <div className="font-mono text-[11px] tracking-[0.14em] text-ink-soft">DISPLAY CURRENCY</div>
        <div className="mt-1.5 text-[13px] text-ink-muted">
          A preference, never an identity. Rates marked{" "}
          <span className="font-mono rounded border-[1.5px] border-gold px-[5px] py-[1px] text-[10px] text-gold">demo rate</span> on
          testnet — real balances are only ever denominated in USDC/EURC.
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2.5 p-[18px]">
        {CURRENCIES.map((c) => (
          <CurrencyButton key={c} code={c} active={currency === c} onClick={() => setCurrency(c)} />
        ))}
      </div>
    </div>
  );
}

function CurrencyButton({ code, active, onClick }: { code: CurrencyCode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono rounded-lg border-[1.5px] py-3 text-center transition-colors ${
        active ? "border-gold text-gold" : "border-ink-line text-ink hover:border-ink-soft"
      }`}
      style={{ background: active ? "rgba(231,178,90,0.1)" : "var(--color-parchment)" }}
    >
      <div className="text-[17px] font-bold">{DEMO_RATES[code].symbol}</div>
      <div className="mt-[3px] text-[10px] tracking-[0.08em]">{code}</div>
    </button>
  );
}
