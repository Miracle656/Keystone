/**
 * Restart-safe cancel-tracked-orders reconciliation, shared by mm-bot and
 * reserve-keeper. Given a set of order IDs a bot *believes* are still resting
 * (persisted locally, see bot-state.ts), only actually cancels the ones that are
 * still active on-chain — an order might have already been fully filled or
 * canceled since the state file was last written (e.g. the process was killed
 * mid-cycle), and re-canceling an inactive order is both unnecessary and, for a
 * contract that reverts on an already-inactive order, actively wrong.
 *
 * This is what makes the bots' cancel-replace loop idempotent across restarts:
 * calling it twice in a row (or after a crash) never double-cancels or throws on
 * stale IDs, it just converges to "nothing tracked is still resting."
 */
export interface TrackedOrder {
  active: boolean;
}

export async function reconcileAndCancel(
  orderIds: string[],
  getOrder: (id: bigint) => Promise<TrackedOrder>,
  cancel: (id: bigint) => Promise<void>,
): Promise<{ canceled: string[]; skipped: string[] }> {
  const canceled: string[] = [];
  const skipped: string[] = [];

  for (const idStr of orderIds) {
    const id = BigInt(idStr);
    const order = await getOrder(id);
    if (!order.active) {
      skipped.push(idStr);
      continue;
    }
    await cancel(id);
    canceled.push(idStr);
  }

  return { canceled, skipped };
}
