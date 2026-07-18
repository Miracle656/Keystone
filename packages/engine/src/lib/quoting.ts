const BPS_DENOM = 10_000n;

export interface InventoryState {
  /** Idle base-asset (EURC) held, base-asset wei. */
  idleBase: bigint;
  /** Idle quote-asset (USDC) held, quote-asset wei. */
  idleQuote: bigint;
}

export interface QuoteParams {
  /** Reference mid, KeystoneBook PRICE_SCALE (1e6) units — e.g. 1_080_000 for 1.08. */
  mid: bigint;
  /** Half-spread applied on each side of the (possibly skewed) mid, in bps. */
  spreadBps: number;
  /** Order size on each side, base-asset wei. */
  size: bigint;
  /** Pair's tick size — every returned price is rounded to a multiple of this. */
  tickSize: bigint;
  inventory: InventoryState;
  /** Max mid-shift applied at 100%-one-sided inventory, in bps. Default 0 (no skew). */
  maxSkewShadeBps?: number;
}

export interface Quote {
  bidPrice: bigint;
  askPrice: bigint;
  bidQty: bigint;
  askQty: bigint;
  /** The skew-adjusted mid actually used to derive bid/ask, for logging. */
  effectiveMid: bigint;
  /** Inventory skew fraction used, in [0, 1] scaled by 1e4 (5000 = perfectly balanced). */
  skewFractionBps: number;
}

/**
 * Inventory-aware quoting: shifts the center price toward rebalancing (long base ->
 * shade mid down, making the bot keener to sell / less keen to buy more base; long
 * quote -> shade up), then lays a symmetric spread around that shifted center.
 *
 * Skew is computed in quote-equivalent NAV terms: skewFraction = baseValue / (baseValue
 * + idleQuote), where baseValue = idleBase * mid / PRICE_SCALE. 0.5 = balanced.
 */
export function computeQuote(params: QuoteParams): Quote {
  const { mid, spreadBps, size, tickSize, inventory, maxSkewShadeBps = 0 } = params;
  if (mid <= 0n) throw new Error("mid must be positive");
  if (tickSize <= 0n) throw new Error("tickSize must be positive");

  const PRICE_SCALE = 1_000_000n;
  const baseValue = (inventory.idleBase * mid) / PRICE_SCALE;
  const totalValue = baseValue + inventory.idleQuote;

  // skewFractionBps in [0, 10000]; 5000 = balanced. Defined as 5000 when totalValue is
  // 0 (nothing deposited yet) so an empty vault/wallet doesn't spuriously skew quotes.
  const skewFractionBps = totalValue === 0n ? 5000 : Number((baseValue * BPS_DENOM) / totalValue);

  // shadeBps ranges +maxSkewShadeBps (all quote, shade mid UP -> keener to buy more base)
  // .. 0 (balanced) .. -maxSkewShadeBps (all base, shade mid DOWN -> keener to sell it off).
  // Note the (5000 - skewFraction) order, not (skewFraction - 5000): base-heavy must produce
  // a *negative* shade to push the mid down, which is what a caught-by-its-own-unit-test bug
  // got backwards on the first pass — see DECISIONS.md.
  const shadeBps = (BigInt(Math.round(maxSkewShadeBps)) * (5000n - BigInt(skewFractionBps))) / 5000n;
  const effectiveMid = (mid * (BPS_DENOM + shadeBps)) / BPS_DENOM;

  const rawBid = (effectiveMid * (BPS_DENOM - BigInt(spreadBps))) / BPS_DENOM;
  const rawAsk = (effectiveMid * (BPS_DENOM + BigInt(spreadBps))) / BPS_DENOM;

  let bidPrice = roundDownToTick(rawBid, tickSize);
  let askPrice = roundUpToTick(rawAsk, tickSize);

  // Guarantee at least one tick of daylight between bid and ask even if spreadBps is
  // tiny relative to tickSize (rounding could otherwise collapse them to the same
  // price, which would make the bot cross its own quotes).
  if (askPrice <= bidPrice) {
    askPrice = bidPrice + tickSize;
  }
  if (bidPrice <= 0n) {
    bidPrice = tickSize; // never quote a non-positive or zero price
  }

  return { bidPrice, askPrice, bidQty: size, askQty: size, effectiveMid, skewFractionBps };
}

export function roundDownToTick(price: bigint, tickSize: bigint): bigint {
  return (price / tickSize) * tickSize;
}

export function roundUpToTick(price: bigint, tickSize: bigint): bigint {
  const rem = price % tickSize;
  return rem === 0n ? price : price + (tickSize - rem);
}
