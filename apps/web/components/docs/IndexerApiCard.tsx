const ENDPOINTS = [
  { path: "/api/pairs", note: "listed pairs" },
  { path: "/api/book/:pairId", note: "live bid/ask depth" },
  { path: "/api/trades/:pairId?limit=", note: "public trade tape" },
  { path: "/api/candles/:pairId?interval=&limit=", note: "OHLCV, 1m–1d" },
  { path: "/api/orders/:owner", note: "one wallet's orders" },
  { path: "/api/orders/recent/:pairId?limit=", note: "recent orders, all owners" },
  { path: "/api/fills/:owner?limit=", note: "one wallet's fills" },
  { path: "/api/reserve/apy", note: "real Reserve APY + NAV series" },
  { path: "/api/stats?pairId=", note: "all-time volume/trades/fees" },
];

export function IndexerApiCard() {
  return (
    <div className="rounded-2xl border border-ink-line bg-panel">
      <div className="border-b border-ink-line px-[22px] py-4">
        <div className="font-mono text-[11px] tracking-[0.14em] text-ink-soft">INDEXER REST API — READ-ONLY, NO KEY</div>
        <div className="font-mono mt-1.5 text-[12px] text-gold">https://keystone-indexer.onrender.com</div>
      </div>
      <div className="px-[22px] py-1">
        {ENDPOINTS.map((e) => (
          <div key={e.path} className="flex items-center justify-between border-b border-ink-line-soft py-[9px] last:border-b-0">
            <span className="font-mono text-[11.5px] text-ink">{e.path}</span>
            <span className="font-mono text-[10.5px] text-ink-faint">{e.note}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-line px-[22px] py-3 text-[11px] text-ink-faint">
        Open CORS, no auth, no rate-limit story yet — same data this app itself reads. Runs on Render&apos;s free tier, so it can take a
        few seconds to wake up if it&apos;s been idle.
      </div>
    </div>
  );
}
