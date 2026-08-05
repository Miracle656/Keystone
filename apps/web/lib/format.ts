import { formatUnits } from "viem";

/** All Book prices/qtys are stored as raw decimal-string bigints (PRICE_SCALE=1e6 for price,
 * 6-decimal token units for qty) — see packages/indexer's schema notes. */
export function formatPrice(raw: string | bigint): string {
  return Number(formatUnits(BigInt(raw), 6)).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function formatQty(raw: string | bigint): string {
  return Number(formatUnits(BigInt(raw), 6)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function formatUsd(raw: string | bigint, decimals = 6): string {
  return "$" + Number(formatUnits(BigInt(raw), decimals)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function timeAgo(unixSeconds: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
