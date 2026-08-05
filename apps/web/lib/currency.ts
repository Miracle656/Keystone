// Display-currency conversion — PRD M9 explicitly sanctions demo FX rates for this feature as
// long as they're labeled, unlike the rest of the app's real-data-only rule. Real-time FX would
// need a paid rate feed for no product benefit here; USD is the only currency real balances are
// actually denominated in.
export const CURRENCIES = ["USD", "EUR", "PHP", "BRL", "NGN", "JPY", "MXN", "KRW"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEMO_RATES: Record<CurrencyCode, { symbol: string; rate: number; decimals: number }> = {
  USD: { symbol: "$", rate: 1, decimals: 2 },
  EUR: { symbol: "€", rate: 0.869, decimals: 2 },
  PHP: { symbol: "₱", rate: 56.2, decimals: 0 },
  BRL: { symbol: "R$", rate: 5.41, decimals: 2 },
  NGN: { symbol: "₦", rate: 1478, decimals: 0 },
  JPY: { symbol: "¥", rate: 156.4, decimals: 0 },
  MXN: { symbol: "$", rate: 18.2, decimals: 2 },
  KRW: { symbol: "₩", rate: 1372, decimals: 0 },
};

export function formatCurrency(usd: number, currency: CurrencyCode): string {
  const r = DEMO_RATES[currency];
  return r.symbol + (usd * r.rate).toLocaleString("en-US", { minimumFractionDigits: r.decimals, maximumFractionDigits: r.decimals });
}
