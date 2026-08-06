"use client";

import { useAccount, useConnect } from "wagmi";
import { PortfolioNav } from "@/components/portfolio/PortfolioNav";
import { PortfolioStats } from "@/components/portfolio/PortfolioStats";
import { BookBalances } from "@/components/portfolio/BookBalances";
import { ReservePosition } from "@/components/portfolio/ReservePosition";
import { PortfolioOrders } from "@/components/portfolio/PortfolioOrders";
import { usePortfolio } from "@/lib/hooks/usePortfolio";

export default function PortfolioPage() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];
  const { totalValueUsd, bookValueUsd, reserveValueUsd, usdc, eurc, reserve, openOrders } = usePortfolio();

  return (
    <div className="min-h-screen text-ink" style={{ fontFamily: "var(--font-figtree), sans-serif" }}>
      <PortfolioNav />

      <div className="mx-auto max-w-[1180px] px-6 py-9 pb-[90px]">
        <div className="mb-6">
          <h1 className="mb-1.5 text-[40px] font-extrabold tracking-[-0.03em]">Portfolio</h1>
          <p className="max-w-[560px] text-[15px] text-ink-muted">
            Everything you hold on Keystone — trading balances in the Book, your position in the Reserve vault, and open orders — in
            one view.
          </p>
        </div>

        {!isConnected ? (
          <div className="rounded-2xl border-[1.5px] border-dashed border-ink-line bg-panel px-10 py-10 text-center">
            <div className="mb-2 text-[20px] font-extrabold text-ink">Connect your wallet to see your portfolio</div>
            <p className="mx-auto mb-5 max-w-[460px] text-[14px] text-ink-muted">
              Your Book balances, Reserve position, and open orders — read straight from Keystone&apos;s contracts on Arc.
            </p>
            <button
              onClick={() => injectedConnector && connect({ connector: injectedConnector })}
              disabled={isPending || !injectedConnector}
              className="font-mono rounded-lg bg-gold px-7 py-3.5 text-[13px] font-bold text-cream transition-colors hover:bg-gold-bright disabled:opacity-50"
            >
              {isPending ? "CONNECTING…" : "CONNECT WALLET →"}
            </button>
          </div>
        ) : (
          <>
            <PortfolioStats currency="USD" totalValueUsd={totalValueUsd} bookValueUsd={bookValueUsd} reserveValueUsd={reserveValueUsd} />

            <div className="mb-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-2">
              <BookBalances usdc={usdc} eurc={eurc} />
              <ReservePosition shares={reserve.shares} sharePrice={reserve.sharePrice} valueUsd={reserve.valueUsd} />
            </div>

            <PortfolioOrders orders={openOrders} />
          </>
        )}
      </div>
    </div>
  );
}
