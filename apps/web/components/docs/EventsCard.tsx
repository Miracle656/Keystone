const EVENTS = [
  { name: "OrderPlaced", color: "text-gold", sig: "(orderId, owner, pairId, isBid, price, qty, flags)" },
  { name: "OrderFilled", color: "text-bid", sig: "(orderId, maker, taker, price, qty, fee)" },
  { name: "OrderCanceled", color: "text-ink-soft", sig: "(orderId, refundedQty)" },
  { name: "TradeExecuted", color: "text-bid", sig: "(pairId, price, qty, takerIsBid)" },
];

export function EventsCard() {
  return (
    <div className="rounded-2xl border border-ink-line bg-panel">
      <div className="font-mono border-b border-ink-line px-[22px] py-4 text-[11px] tracking-[0.14em] text-ink-soft">
        EVENT SURFACE — KEYSTONEBOOK
      </div>
      <div className="grid gap-3 px-[22px] py-[18px]">
        {EVENTS.map((e) => (
          <div key={e.name} className="font-mono text-[12px] leading-relaxed">
            <span className={`font-bold ${e.color}`}>{e.name}</span> <span className="text-ink-faint">{e.sig}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-line px-[22px] py-3 text-[11px] text-ink-faint">
        Every order, cancel, and fill is one of these — no polling required if you run your own log listener.{" "}
        <a href="/transparency" className="text-gold hover:text-ink">
          Decode a real one →
        </a>
      </div>
    </div>
  );
}
