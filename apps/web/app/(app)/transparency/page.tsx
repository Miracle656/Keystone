"use client";

import { TransparencyNav } from "@/components/transparency/TransparencyNav";
import { StatsRow } from "@/components/transparency/StatsRow";
import { VerifyFill } from "@/components/transparency/VerifyFill";
import { EventFeed } from "@/components/transparency/EventFeed";
import { arcTestnet } from "@/lib/wagmi";

export default function TransparencyPage() {
  return (
    <div className="min-h-screen text-ink" style={{ fontFamily: "var(--font-figtree), sans-serif" }}>
      <TransparencyNav />

      <div className="mx-auto max-w-[1180px] px-6 py-9 pb-[90px]">
        <h1 className="mb-2.5 text-[40px] font-extrabold tracking-[-0.03em]">Transparency</h1>
        <p className="mb-8 max-w-[620px] text-[15px] text-ink-muted">
          Every number below reads straight from Arc Testnet or Keystone&apos;s own indexer — nothing here is claimed that can&apos;t
          be replayed on{" "}
          <a href={arcTestnet.blockExplorers.default.url} target="_blank" rel="noreferrer" className="text-gold hover:text-ink">
            {arcTestnet.blockExplorers.default.url.replace("https://", "")}
          </a>
          .
        </p>

        <StatsRow />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[5fr_7fr]">
          <VerifyFill />
          <EventFeed />
        </div>
      </div>
    </div>
  );
}
