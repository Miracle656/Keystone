import Link from "next/link";
import { formatPrice, formatQty } from "@/lib/format";
import type { IndexedOrder } from "@/lib/indexer";

export function PortfolioOrders({ orders }: { orders: IndexedOrder[] }) {
  return (
    <div className="rounded-2xl border border-ink-line bg-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.14em] text-ink-soft">OPEN ORDERS ({orders.length})</span>
        <Link href="/trade" className="font-mono text-[11px] text-gold">
          GO TO TRADE →
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="py-6 text-center text-[12px] text-ink-soft">No open orders.</div>
      ) : (
        <div>
          <div className="font-mono grid grid-cols-[1.2fr_0.7fr_1fr_1fr_1fr_0.9fr] pb-2.5 text-[9.5px] tracking-[0.06em] text-ink-soft">
            <span>PAIR</span>
            <span>SIDE</span>
            <span className="text-right">PRICE</span>
            <span className="text-right">AMOUNT</span>
            <span className="text-right">FILLED</span>
            <span className="text-right">STATUS</span>
          </div>
          {orders.map((o) => {
            const filledPct = o.qty === "0" ? 0 : Math.round(((Number(o.qty) - Number(o.remaining)) / Number(o.qty)) * 100);
            return (
              <div
                key={o.orderId}
                className="font-mono grid grid-cols-[1.2fr_0.7fr_1fr_1fr_1fr_0.9fr] items-center border-t border-ink-line-soft py-2.5 text-[12px]"
              >
                <span className="text-ink-muted">USDC/EURC</span>
                <span className={`font-bold ${o.isBid ? "text-bid" : "text-ask"}`}>{o.isBid ? "BUY" : "SELL"}</span>
                <span className="text-right text-ink">{formatPrice(o.price)}</span>
                <span className="text-right text-ink-muted">{formatQty(o.qty)}</span>
                <span className="text-right text-ink-soft">{filledPct}%</span>
                <span className={`text-right font-semibold ${filledPct > 0 ? "text-bid" : "text-gold"}`}>
                  {filledPct > 0 ? "PARTIAL" : "RESTING"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
