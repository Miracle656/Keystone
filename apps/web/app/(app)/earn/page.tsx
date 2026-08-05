"use client";

import { useState } from "react";
import Link from "next/link";
import { EarnNav } from "@/components/earn/EarnNav";
import { UnifiedBalancePanel } from "@/components/earn/UnifiedBalancePanel";
import { StatsPanel } from "@/components/earn/StatsPanel";
import { VaultTable } from "@/components/earn/VaultTable";
import { type CurrencyCode } from "@/lib/currency";

export default function EarnPage() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  return (
    <div className="min-h-screen text-ink" style={{ fontFamily: "var(--font-figtree), sans-serif" }}>
      <EarnNav currency={currency} onCurrency={setCurrency} />

      <div className="mx-auto max-w-[1180px] px-6 py-9 pb-[90px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
          <div>
            <h1 className="mb-1.5 text-[40px] font-extrabold tracking-[-0.03em]">Earn</h1>
            <p className="max-w-[560px] text-[15px] text-ink-muted">
              Your USDC on any chain, quoting Keystone&apos;s on-chain books. Connect a wallet, deposit from wherever it sits — settle
              and earn on Arc.
            </p>
          </div>
          <span className="font-mono rounded-md border-[1.5px] border-gold px-2.5 py-[5px] text-[11px] text-gold">
            REAL YIELD ONLY · NO POINTS
          </span>
        </div>

        <UnifiedBalancePanel currency={currency} />
        <StatsPanel currency={currency} />
        <VaultTable currency={currency} />

        <p className="font-mono mt-5 text-center text-[10px] text-ink-faint">
          Every vault quotes real orders on Keystone. Yield = maker fees + spread captured, settled on-chain ·{" "}
          <Link href="/transparency" className="text-gold">
            SEE RECEIPTS →
          </Link>
        </p>
      </div>
    </div>
  );
}
