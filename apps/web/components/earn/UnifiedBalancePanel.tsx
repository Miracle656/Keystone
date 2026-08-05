"use client";

import Image from "next/image";
import Link from "next/link";
import { useAccount, useConnect } from "wagmi";
import { useUnifiedBalance } from "@/lib/hooks/useUnifiedBalance";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function UnifiedBalancePanel({ currency }: { currency: CurrencyCode }) {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { balances, totalHuman, isLoading } = useUnifiedBalance();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];

  if (!isConnected) {
    return (
      <div className="mb-[18px] rounded-2xl border-[1.5px] border-dashed border-ink-line bg-panel px-10 py-10 text-center">
        <div className="mb-2 text-[20px] font-extrabold text-ink">Connect your wallet to see your unified balance</div>
        <p className="mx-auto mb-5 max-w-[460px] text-[14px] text-ink-muted">
          Keystone scans your USDC across every connected chain and shows what it could be earning here — one tap to put it to work.
        </p>
        <button
          onClick={() => injectedConnector && connect({ connector: injectedConnector })}
          disabled={isPending || !injectedConnector}
          className="font-mono rounded-lg bg-gold px-7 py-3.5 text-[13px] font-bold text-cream transition-colors hover:bg-gold-bright disabled:opacity-50"
        >
          {isPending ? "CONNECTING…" : "CONNECT WALLET →"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative mb-[18px] grid grid-cols-1 gap-[30px] overflow-hidden rounded-2xl border border-[rgba(21,27,38,0.2)] p-6 md:grid-cols-[1fr_1.3fr]" style={{ background: "linear-gradient(120deg, #16233B, #1F3252)", color: "#F3EFE4" }}>
      <div
        className="pointer-events-none absolute -right-[10%] -top-[40%] h-[320px] w-[320px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,178,90,0.22), transparent 66%)" }}
      />
      <div className="relative">
        <div className="font-mono mb-2.5 flex items-center gap-2 text-[10px] tracking-[0.16em]" style={{ color: "rgba(243,239,228,0.6)" }}>
          <Image src="/brand/usdc.svg" alt="" width={16} height={16} className="rounded" /> UNIFIED USDC BALANCE
        </div>
        <div className="font-mono text-[42px] font-bold leading-none tracking-[-0.02em]">
          {isLoading ? "…" : formatCurrency(totalHuman, currency)}
        </div>
        <div className="font-mono mt-2.5 text-[12px]" style={{ color: "rgba(243,239,228,0.6)" }}>
          {totalHuman.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC across {balances.filter((b) => b.balanceHuman > 0).length} of {balances.length} connected chains · deposit into the vault below
        </div>
      </div>
      <div className="relative">
        <div className="font-mono mb-3 text-[10px] tracking-[0.14em]" style={{ color: "rgba(243,239,228,0.6)" }}>
          SOURCE CHAINS — ARC UNIFIED BALANCE
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {balances.map((b) => (
            <div key={b.id} className="flex items-center gap-2.5 rounded-lg border border-[rgba(243,239,228,0.12)] bg-[rgba(243,239,228,0.07)] px-3 py-2.5">
              <div
                className="relative flex h-6 w-6 flex-none items-center justify-center overflow-hidden rounded-full"
                style={b.logoBg ? { background: b.logoBg } : undefined}
              >
                <Image src={b.logo} alt={b.name} fill sizes="24px" className={b.logoBg ? "object-contain p-1" : "object-cover"} />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-bold">{b.name}</div>
                <div className="font-mono text-[10px]" style={{ color: "rgba(243,239,228,0.55)" }}>
                  {b.balanceHuman.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-2.5 rounded-lg border border-dashed border-[rgba(243,239,228,0.25)] px-3 py-2.5">
            <span className="font-mono text-[10.5px]" style={{ color: "rgba(243,239,228,0.5)" }}>
              + Solana, more — coming soon
            </span>
          </div>
        </div>
        <Link href="/settings" className="font-mono mt-3 inline-block text-[11px]" style={{ color: "#E7B25A" }}>
          + MANAGE WALLETS IN SETTINGS →
        </Link>
      </div>
    </div>
  );
}
