import { describe, it, expect, vi } from "vitest";
import { reconcileAndCancel } from "../src/lib/idempotency.js";

describe("reconcileAndCancel", () => {
  it("cancels only orders that are still active on-chain", async () => {
    const getOrder = vi.fn(async (id: bigint) => ({ active: id !== 2n })); // order 2 already inactive
    const cancel = vi.fn(async (_id: bigint) => {});

    const { canceled, skipped } = await reconcileAndCancel(["1", "2", "3"], getOrder, cancel);

    expect(canceled).toEqual(["1", "3"]);
    expect(skipped).toEqual(["2"]);
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledWith(1n);
    expect(cancel).toHaveBeenCalledWith(3n);
    expect(cancel).not.toHaveBeenCalledWith(2n);
  });

  it("is a no-op given an empty tracked list (fresh start / already-reconciled)", async () => {
    const getOrder = vi.fn();
    const cancel = vi.fn();

    const { canceled, skipped } = await reconcileAndCancel([], getOrder, cancel);

    expect(canceled).toEqual([]);
    expect(skipped).toEqual([]);
    expect(getOrder).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("calling it twice in a row with the same tracked IDs never double-cancels", async () => {
    // Simulates a restart: the process crashes right after canceling but before
    // persisting the new (empty) state, so it reconciles the same IDs again.
    const active = new Map<bigint, boolean>([[1n, true], [2n, true]]);
    const getOrder = vi.fn(async (id: bigint) => ({ active: active.get(id) ?? false }));
    const cancel = vi.fn(async (id: bigint) => {
      active.set(id, false); // real cancel would flip the on-chain state too
    });

    const first = await reconcileAndCancel(["1", "2"], getOrder, cancel);
    expect(first.canceled).toEqual(["1", "2"]);

    const second = await reconcileAndCancel(["1", "2"], getOrder, cancel);
    expect(second.canceled).toEqual([]); // both already inactive now
    expect(second.skipped).toEqual(["1", "2"]);
    expect(cancel).toHaveBeenCalledTimes(2); // not 4 — the second pass canceled nothing new
  });

  it("propagates a cancel failure rather than silently swallowing it", async () => {
    const getOrder = vi.fn(async () => ({ active: true }));
    const cancel = vi.fn(async () => {
      throw new Error("RPC boom");
    });

    await expect(reconcileAndCancel(["1"], getOrder, cancel)).rejects.toThrow("RPC boom");
  });
});
