// Demo-only market data ported from the Keystone Mobile design mockup — the real order book,
// swap, and bridge execution (kit.swap()/kit.bridge(), packages/indexer's book) are a follow-up;
// everything here is clearly surfaced as DEMO in the UI, same "real data only, honestly labeled"
// convention apps/web already follows (KEYSTONE_PRD.md §9 "SIMULATED (labeled)").
export const RATES: Record<string, { sym: string; rate: number; dp: number }> = {
  USD: { sym: "$", rate: 1, dp: 2 },
  EUR: { sym: "€", rate: 0.869, dp: 2 },
  PHP: { sym: "₱", rate: 56.2, dp: 0 },
  BRL: { sym: "R$", rate: 5.41, dp: 2 },
  NGN: { sym: "₦", rate: 1478, dp: 0 },
};

export function formatCurrency(usd: number, currency: string) {
  const r = RATES[currency] ?? RATES.USD;
  return r.sym + (usd * r.rate).toLocaleString("en-US", { minimumFractionDigits: r.dp, maximumFractionDigits: r.dp });
}

export function nextCurrency(current: string) {
  const keys = Object.keys(RATES);
  return keys[(keys.indexOf(current) + 1) % keys.length];
}

export type Level = { price: string; size: string; total: string; depthPct: number };

export function levels(side: "ask" | "bid", mid: number): Level[] {
  const tick = 0.0002;
  let total = 0;
  return Array.from({ length: 5 }, (_, i) => {
    const price = side === "ask" ? mid + tick * (i + 1) : mid - tick * (i + 1);
    const size = Math.round(400 + Math.abs(Math.sin(price * 9000 + i)) * 5200);
    total += size;
    return {
      price: price.toFixed(4),
      size: size.toLocaleString("en-US"),
      total: (total / 1000).toFixed(1) + "K",
      depthPct: Math.min(94, Math.round(total / 200)),
    };
  });
}

export type ActivityEvent = {
  glyph: string;
  color: string;
  bg: string;
  title: string;
  detail: string;
  time: string;
  tx: string;
};

const EVENT_KINDS: Omit<ActivityEvent, "time" | "tx">[] = [
  { glyph: "✓", color: "#2FBF71", bg: "rgba(47,191,113,0.14)", title: "Filled 2,500 USDC @ 1.1512", detail: "TradeExecuted · maker reserve.keystone.arc" },
  { glyph: "◆", color: "#E7B25A", bg: "rgba(231,178,90,0.14)", title: "Limit placed · BUY 2,500 @ 1.1506", detail: "OrderPlaced · resting on the book" },
  { glyph: "⇄", color: "#5B9CF6", bg: "rgba(91,156,246,0.14)", title: "Bridged in 2,500 USDC", detail: "BASE → ARC · Gateway + CCTP v2" },
  { glyph: "%", color: "#2FBF71", bg: "rgba(47,191,113,0.14)", title: "Reserve harvested +$6.42", detail: "FeesHarvested · share price → 1.0231" },
  { glyph: "✕", color: "rgba(245,241,230,0.5)", bg: "rgba(245,241,230,0.06)", title: "Canceled · SELL 800 @ 1.1524", detail: "OrderCanceled · cancel-replace" },
  { glyph: "✓", color: "#2FBF71", bg: "rgba(47,191,113,0.14)", title: "Filled 1,200 USDC @ 1.1509", detail: "TradeExecuted · taker rafael.arc" },
  { glyph: "⇄", color: "#5B9CF6", bg: "rgba(91,156,246,0.14)", title: "Withdrew 1,850 USDC", detail: "ARC → ARBITRUM · CCTP v2" },
  { glyph: "◆", color: "#E7B25A", bg: "rgba(231,178,90,0.14)", title: "Deposited 1,264 USDC to Reserve", detail: "KeystoneReserve · ERC-4626 shares minted" },
];
const EVENT_TIMES = ["2m", "9m", "31m", "1h", "2h", "5h", "1d", "3d"];

export function mockEvents(): ActivityEvent[] {
  return EVENT_KINDS.map((k, i) => ({
    ...k,
    time: EVENT_TIMES[i] + " ago",
    tx: "0x" + (0x4c1f + i * 0x9d7).toString(16).slice(0, 4) + "…" + (0xa92b - i * 0x3f1).toString(16).slice(0, 4),
  }));
}

// Arbitrum has a real logo (assets/arbitrum.png, from the design project). Base and Solana use
// brand-accurate color badges instead — repeated attempts to pull their real assets out of this
// session risked silently corrupting the binary, so a reliable colored badge beat a maybe-broken
// image for a screen that's already DEMO-labeled end to end.
export const BRIDGE_CHAINS = [
  { name: "BASE", color: "#0052FF" },
  { name: "ARBITRUM", color: "#213147", logo: true },
  { name: "SOLANA", color: "#9945FF" },
];
