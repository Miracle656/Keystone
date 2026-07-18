import { KEYSTONE_BOOK_ABI } from "@keystone/shared";
import type { Log } from "viem";
import { arcPublicClient } from "./lib/rpc.js";
import { db, rawDb } from "./db/client.js";
import { orders, trades, fills } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { KEYSTONE_BOOK_ADDRESS, DEPLOY_BLOCK, POLL_INTERVAL_MS, LOG_BATCH_SIZE } from "./config.js";
import { logger } from "./lib/logger.js";

const BOOK_EVENTS = KEYSTONE_BOOK_ABI.filter((e) => e.type === "event");

type DecodedLog = Log<bigint, number, false, undefined, true, typeof BOOK_EVENTS>;

function getLastIndexedBlock(): bigint {
  const row = rawDb.prepare("SELECT last_indexed_block FROM indexer_state WHERE id = 1").get() as
    | { last_indexed_block: number }
    | undefined;
  return row ? BigInt(row.last_indexed_block) : DEPLOY_BLOCK;
}

/** Processes one transaction's worth of Book logs (already sorted by logIndex). A single tx
 * calls exactly one of placeLimit/placeMarket/cancel, so at most one OrderPlaced appears here,
 * and every OrderFilled in the same tx is necessarily a fill of THAT order acting as taker
 * (KeystoneBook's matching only fills the incoming order against pre-existing resting orders on
 * the other side — see KeystoneBook._match). That's what makes it possible to recover a taker
 * order's final `remaining` even though OrderFilled only names the maker's orderId. */
function processTxLogs(logs: DecodedLog[], blockTimestamp: number) {
  const placed = logs.find((l) => l.eventName === "OrderPlaced");
  const filledLogs = logs.filter((l) => l.eventName === "OrderFilled");
  const canceledLogs = logs.filter((l) => l.eventName === "OrderCanceled");
  const tradeLogs = logs.filter((l) => l.eventName === "TradeExecuted");

  const blockNumber = Number(logs[0].blockNumber);
  const txHash = logs[0].transactionHash!;

  if (placed) {
    const { orderId, owner, pairId, isBid, price, qty, flags } = placed.args as {
      orderId: bigint; owner: `0x${string}`; pairId: bigint; isBid: boolean; price: bigint; qty: bigint; flags: number;
    };
    const takerFilled = filledLogs.reduce((sum, l) => sum + (l.args as { qty: bigint }).qty, 0n);
    const remaining = qty - takerFilled;
    const canceledSameOrder = canceledLogs.some((l) => (l.args as { orderId: bigint }).orderId === orderId);

    const status = canceledSameOrder ? "canceled" : remaining === 0n ? "filled" : "open";

    db.insert(orders)
      .values({
        orderId: orderId.toString(),
        owner,
        pairId: Number(pairId),
        isBid,
        price: price.toString(),
        qty: qty.toString(),
        remaining: (canceledSameOrder ? 0n : remaining).toString(),
        flags,
        status,
        placedBlock: blockNumber,
        placedTx: txHash,
        placedAt: blockTimestamp,
        updatedBlock: blockNumber,
        updatedAt: blockTimestamp,
      })
      .onConflictDoNothing()
      .run();
  }

  for (const log of filledLogs) {
    const { orderId, maker, taker, price, qty, fee } = log.args as {
      orderId: bigint; maker: `0x${string}`; taker: `0x${string}`; price: bigint; qty: bigint; fee: bigint;
    };

    // Maker order was necessarily inserted in an earlier transaction (see fn doc) — skip the
    // update if this is the same order just inserted above (taker fully self-filling its own
    // resting order in the same tx is impossible on this book, but stay defensive).
    if (!placed || (placed.args as { orderId: bigint }).orderId !== orderId) {
      const makerRow = db.select().from(orders).where(eq(orders.orderId, orderId.toString())).get();
      if (makerRow) {
        const newRemaining = BigInt(makerRow.remaining) - qty;
        db.update(orders)
          .set({
            remaining: newRemaining.toString(),
            status: newRemaining <= 0n ? "filled" : makerRow.status,
            updatedBlock: blockNumber,
            updatedAt: blockTimestamp,
          })
          .where(eq(orders.orderId, orderId.toString()))
          .run();
      } else {
        logger.warn({ orderId: orderId.toString(), txHash }, "OrderFilled referenced a maker order not seen by the indexer (backfill gap?)");
      }
    }

    db.insert(fills)
      .values({
        orderId: orderId.toString(),
        maker,
        taker,
        price: price.toString(),
        qty: qty.toString(),
        fee: fee.toString(),
        blockNumber,
        logIndex: log.logIndex!,
        txHash,
        timestamp: blockTimestamp,
      })
      .onConflictDoNothing()
      .run();
  }

  for (const log of canceledLogs) {
    const { orderId } = log.args as { orderId: bigint; refundedQty: bigint };
    // Standalone cancel() of a pre-existing resting order — the same-tx IOC-leftover case was
    // already folded into the insert above and shouldn't be double-applied here.
    if (!placed || (placed.args as { orderId: bigint }).orderId !== orderId) {
      db.update(orders)
        .set({ remaining: "0", status: "canceled", updatedBlock: blockNumber, updatedAt: blockTimestamp })
        .where(eq(orders.orderId, orderId.toString()))
        .run();
    }
  }

  for (const log of tradeLogs) {
    const { pairId, price, qty, takerIsBid } = log.args as { pairId: bigint; price: bigint; qty: bigint; takerIsBid: boolean };
    db.insert(trades)
      .values({
        pairId: Number(pairId),
        price: price.toString(),
        qty: qty.toString(),
        takerIsBid,
        blockNumber,
        logIndex: log.logIndex!,
        txHash,
        timestamp: blockTimestamp,
      })
      .onConflictDoNothing()
      .run();
  }
}

async function processBatch(fromBlock: bigint, toBlock: bigint) {
  const client = arcPublicClient();
  const logs = (await client.getLogs({
    address: KEYSTONE_BOOK_ADDRESS,
    events: BOOK_EVENTS,
    fromBlock,
    toBlock,
  })) as DecodedLog[];

  if (logs.length === 0) {
    rawDb.prepare("UPDATE indexer_state SET last_indexed_block = ? WHERE id = 1").run(Number(toBlock));
    return 0;
  }

  const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
  const timestamps = new Map<bigint, number>();
  for (const bn of blockNumbers) {
    const block = await client.getBlock({ blockNumber: bn });
    timestamps.set(bn, Number(block.timestamp));
  }

  const byTx = new Map<string, DecodedLog[]>();
  for (const log of logs) {
    const key = log.transactionHash!;
    const group = byTx.get(key) ?? [];
    group.push(log);
    byTx.set(key, group);
  }
  for (const group of byTx.values()) group.sort((a, b) => a.logIndex! - b.logIndex!);

  rawDb.transaction(() => {
    for (const group of byTx.values()) {
      processTxLogs(group, timestamps.get(group[0].blockNumber)!);
    }
    rawDb.prepare("UPDATE indexer_state SET last_indexed_block = ? WHERE id = 1").run(Number(toBlock));
  })();

  return logs.length;
}

export async function runIngestLoop() {
  rawDb.prepare("INSERT OR IGNORE INTO indexer_state (id, last_indexed_block) VALUES (1, ?)").run(Number(DEPLOY_BLOCK));

  const client = arcPublicClient();

  for (;;) {
    const head = await client.getBlockNumber();
    let from = getLastIndexedBlock() + 1n;

    if (from > head) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    while (from <= head) {
      const to = from + LOG_BATCH_SIZE - 1n > head ? head : from + LOG_BATCH_SIZE - 1n;
      // A batch's DB writes and its lastIndexedBlock bump commit in one SQLite transaction (see
      // processBatch), so a failed/retried batch can never double-apply — safe to retry in place
      // rather than crash the whole process over what's usually a transient RPC blip (the
      // fallback transport already spans 4 providers, but a provider can still time out mid-call).
      let count: number;
      try {
        count = await processBatch(from, to);
      } catch (err) {
        logger.error({ err, from: from.toString(), to: to.toString() }, "batch failed, retrying after backoff");
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }
      if (count > 0) logger.info({ from: from.toString(), to: to.toString(), events: count }, "indexed batch");
      from = to + 1n;
    }
  }
}
