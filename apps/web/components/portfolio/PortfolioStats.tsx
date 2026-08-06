import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function PortfolioStats({
  currency,
  totalValueUsd,
  bookValueUsd,
  reserveValueUsd,
}: {
  currency: CurrencyCode;
  totalValueUsd: number;
  bookValueUsd: number;
  reserveValueUsd: number;
}) {
  const cards = [
    { label: "TOTAL VALUE", value: totalValueUsd, color: "text-ink" },
    { label: "IN THE BOOK", value: bookValueUsd, color: "text-ink" },
    { label: "IN THE RESERVE", value: reserveValueUsd, color: "text-bid" },
  ];

  return (
    <div className="mb-[18px] grid grid-cols-1 gap-[18px] rounded-2xl border border-ink-line bg-panel sm:grid-cols-3">
      {cards.map((c, i) => (
        <div key={c.label} className={`px-6 py-6 ${i > 0 ? "border-t border-ink-line sm:border-l sm:border-t-0" : ""}`}>
          <div className="font-mono mb-2 text-[10px] tracking-[0.14em] text-ink-soft">{c.label}</div>
          <div className={`font-mono text-[27px] font-bold tracking-[-0.02em] ${c.color}`}>{formatCurrency(c.value, currency)}</div>
        </div>
      ))}
    </div>
  );
}
