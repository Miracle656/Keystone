const FUNCTIONS = [
  { contract: "BalanceManager", sig: "deposit(address token, uint256 amount)", note: "escrow once, trade many" },
  { contract: "BalanceManager", sig: "withdraw(address token, uint256 amount)", note: "" },
  { contract: "KeystoneBook", sig: "placeLimit(pairId, isBid, price, qty, flags, levelHint)", note: "returns (orderId, filledQty)" },
  { contract: "KeystoneBook", sig: "placeMarket(pairId, isBid, qty, worstPrice)", note: "returns (orderId, filledQty)" },
  { contract: "KeystoneBook", sig: "cancel(uint256 orderId)", note: "" },
  { contract: "KeystoneBook", sig: "bestBid(pairId) / bestAsk(pairId)", note: "view" },
];

export function FunctionsCard() {
  return (
    <div className="rounded-2xl border border-ink-line bg-panel">
      <div className="font-mono border-b border-ink-line px-[22px] py-4 text-[11px] tracking-[0.14em] text-ink-soft">
        KEY FUNCTIONS
      </div>
      <div className="px-[22px] py-1">
        {FUNCTIONS.map((f, i) => (
          <div key={i} className="border-b border-ink-line-soft py-[11px] last:border-b-0">
            <div className="font-mono text-[10px] tracking-[0.08em] text-ink-faint">{f.contract}</div>
            <div className="font-mono mt-0.5 text-[12px] text-ink">
              {f.sig}
              {f.note && <span className="ml-2 text-[10.5px] text-ink-faint">{f.note}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-line px-[22px] py-3 text-[11px] text-ink-faint">
        price is 1e6-scaled, qty is 6-decimal token units — same scaling as USDC/EURC themselves. flags bit 0 is POST_ONLY, bit 1 is IOC.
      </div>
    </div>
  );
}
