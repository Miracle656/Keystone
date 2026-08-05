import { parseUnits } from "viem";
import { PRICE_SCALE } from "./constants";

export function parsePrice(input: string): bigint {
  return parseUnits(input || "0", 6);
}

export function parseQty(input: string): bigint {
  return parseUnits(input || "0", 6);
}

export function roundToTick(price: bigint, tick: bigint, direction: "up" | "down"): bigint {
  const rem = price % tick;
  if (rem === 0n) return price;
  return direction === "up" ? price + (tick - rem) : price - rem;
}

export function roundToLot(qty: bigint, lot: bigint): bigint {
  return (qty / lot) * lot;
}

/** notional = price * qty / PRICE_SCALE, both already in 6-decimal token-wei terms. */
export function notional(price: bigint, qty: bigint): bigint {
  return (price * qty) / PRICE_SCALE;
}
