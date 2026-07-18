import { describe, it, expect } from "vitest";
import { computeQuote, roundDownToTick, roundUpToTick } from "../src/lib/quoting.js";

const TICK = 100n;
const LOT = 1_000_000n;
const MID = 1_080_000n; // 1.08

describe("computeQuote — balanced inventory", () => {
  it("centers bid/ask symmetrically around mid with no skew configured", () => {
    const q = computeQuote({
      mid: MID,
      spreadBps: 20, // 0.20%
      size: LOT,
      tickSize: TICK,
      inventory: { idleBase: 0n, idleQuote: 0n }, // nothing deposited yet -> treated as balanced
    });
    expect(q.effectiveMid).toBe(MID); // no shade applied
    expect(q.skewFractionBps).toBe(5000);
    // 1.08 * (1 - 0.002) = 1.07784 -> rounds down to nearest 100 -> 1_077_800
    expect(q.bidPrice).toBe(1_077_800n);
    // 1.08 * (1 + 0.002) = 1.08216 -> rounds up to nearest 100 -> 1_082_200
    expect(q.askPrice).toBe(1_082_200n);
    expect(q.bidQty).toBe(LOT);
    expect(q.askQty).toBe(LOT);
  });

  it("balanced 50/50 value inventory (idleBase*mid == idleQuote) also skews nothing", () => {
    const idleBase = 1_000_000n; // 1.0 EURC
    const idleQuote = (idleBase * MID) / 1_000_000n; // exact quote-equivalent value
    const q = computeQuote({
      mid: MID,
      spreadBps: 20,
      size: LOT,
      tickSize: TICK,
      inventory: { idleBase, idleQuote },
      maxSkewShadeBps: 15,
    });
    expect(q.skewFractionBps).toBe(5000);
    expect(q.effectiveMid).toBe(MID);
  });
});

describe("computeQuote — inventory skew", () => {
  it("shades the mid DOWN when 100% base-heavy (all EURC, no USDC)", () => {
    const q = computeQuote({
      mid: MID,
      spreadBps: 20,
      size: LOT,
      tickSize: TICK,
      inventory: { idleBase: 10_000_000n, idleQuote: 0n }, // 100% base
      maxSkewShadeBps: 15,
    });
    expect(q.skewFractionBps).toBe(10_000); // fully base
    expect(q.effectiveMid).toBeLessThan(MID); // shaded down -> keener to sell, less keen to buy
    // both bid and ask should be lower than the unskewed case
    const unskewed = computeQuote({ mid: MID, spreadBps: 20, size: LOT, tickSize: TICK, inventory: { idleBase: 0n, idleQuote: 0n } });
    expect(q.bidPrice).toBeLessThan(unskewed.bidPrice);
    expect(q.askPrice).toBeLessThan(unskewed.askPrice);
  });

  it("shades the mid UP when 100% quote-heavy (all USDC, no EURC)", () => {
    const q = computeQuote({
      mid: MID,
      spreadBps: 20,
      size: LOT,
      tickSize: TICK,
      inventory: { idleBase: 0n, idleQuote: 10_000_000n }, // 100% quote
      maxSkewShadeBps: 15,
    });
    expect(q.skewFractionBps).toBe(0);
    expect(q.effectiveMid).toBeGreaterThan(MID);
    const unskewed = computeQuote({ mid: MID, spreadBps: 20, size: LOT, tickSize: TICK, inventory: { idleBase: 0n, idleQuote: 0n } });
    expect(q.bidPrice).toBeGreaterThan(unskewed.bidPrice);
    expect(q.askPrice).toBeGreaterThan(unskewed.askPrice);
  });

  it("shade magnitude scales with maxSkewShadeBps", () => {
    const small = computeQuote({ mid: MID, spreadBps: 20, size: LOT, tickSize: TICK, inventory: { idleBase: 10_000_000n, idleQuote: 0n }, maxSkewShadeBps: 5 });
    const large = computeQuote({ mid: MID, spreadBps: 20, size: LOT, tickSize: TICK, inventory: { idleBase: 10_000_000n, idleQuote: 0n }, maxSkewShadeBps: 50 });
    // both fully base-heavy (100%), so larger maxSkewShadeBps must shade further down
    expect(large.effectiveMid).toBeLessThan(small.effectiveMid);
  });

  it("defaults to no skew shading when maxSkewShadeBps is omitted", () => {
    const q = computeQuote({ mid: MID, spreadBps: 20, size: LOT, tickSize: TICK, inventory: { idleBase: 10_000_000n, idleQuote: 0n } });
    expect(q.effectiveMid).toBe(MID);
  });
});

describe("computeQuote — safety invariants", () => {
  it("never lets ask <= bid, even with a spread smaller than one tick", () => {
    const q = computeQuote({ mid: MID, spreadBps: 1, size: LOT, tickSize: TICK, inventory: { idleBase: 0n, idleQuote: 0n } });
    expect(q.askPrice).toBeGreaterThan(q.bidPrice);
  });

  it("never quotes a non-positive bid even at an extreme mid/spread", () => {
    const q = computeQuote({ mid: 50n, spreadBps: 9000, size: LOT, tickSize: TICK, inventory: { idleBase: 0n, idleQuote: 0n } });
    expect(q.bidPrice).toBeGreaterThan(0n);
  });

  it("throws on non-positive mid or tickSize", () => {
    expect(() => computeQuote({ mid: 0n, spreadBps: 20, size: LOT, tickSize: TICK, inventory: { idleBase: 0n, idleQuote: 0n } })).toThrow();
    expect(() => computeQuote({ mid: MID, spreadBps: 20, size: LOT, tickSize: 0n, inventory: { idleBase: 0n, idleQuote: 0n } })).toThrow();
  });

  it("every returned price is an exact multiple of tickSize", () => {
    const q = computeQuote({ mid: 1_080_037n, spreadBps: 37, size: LOT, tickSize: TICK, inventory: { idleBase: 3_141_592n, idleQuote: 2_718_281n }, maxSkewShadeBps: 12 });
    expect(q.bidPrice % TICK).toBe(0n);
    expect(q.askPrice % TICK).toBe(0n);
  });
});

describe("tick rounding helpers", () => {
  it("roundDownToTick floors to the nearest multiple", () => {
    expect(roundDownToTick(1_077_849n, TICK)).toBe(1_077_800n);
    expect(roundDownToTick(1_077_800n, TICK)).toBe(1_077_800n); // exact multiple unchanged
  });

  it("roundUpToTick ceils to the nearest multiple", () => {
    expect(roundUpToTick(1_082_151n, TICK)).toBe(1_082_200n);
    expect(roundUpToTick(1_082_200n, TICK)).toBe(1_082_200n); // exact multiple unchanged
  });
});
