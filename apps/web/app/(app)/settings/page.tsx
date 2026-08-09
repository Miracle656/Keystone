"use client";

import Link from "next/link";
import { SettingsNav } from "@/components/settings/SettingsNav";
import { WalletCard } from "@/components/settings/WalletCard";
import { CurrencyCard } from "@/components/settings/CurrencyCard";
import { RawValuesCard } from "@/components/settings/RawValuesCard";
import { OtherChainsCard } from "@/components/settings/OtherChainsCard";

export default function SettingsPage() {
  return (
    <div className="min-h-screen text-ink" style={{ fontFamily: "var(--font-figtree), sans-serif" }}>
      <SettingsNav />

      <div className="mx-auto max-w-[600px] px-5 py-9 pb-[80px]">
        <h1 className="mb-[30px] text-[40px] font-extrabold tracking-[-0.03em]">Settings</h1>

        <WalletCard />
        <CurrencyCard />
        <RawValuesCard />
        <OtherChainsCard />

        <div className="font-mono mt-7 text-center text-[10px] text-ink-faint">
          KEYSTONE · ARC TESTNET · CHAIN 5042002 ·{" "}
          <Link href="/docs" className="text-gold hover:text-ink">
            DOCS
          </Link>
        </div>
      </div>
    </div>
  );
}
