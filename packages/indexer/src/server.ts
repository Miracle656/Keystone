import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { rawDb } from "./db/client.js";
import { PORT } from "./config.js";
import { logger } from "./lib/logger.js";

const app = new Hono();

// Public read-only market data, no auth — open CORS so the web app (a different origin/port
// in dev, and likely a different origin in prod too) can fetch it directly from the browser.
app.use("*", cors());

// Hardcoded to match packages/engine's router/addresses.ts convention (base=EURC,
// quote=USDC, pairId 0) — the only active pair; USDC/USDT (pairId 1) stays paused
// per the Phase 1 decision to hide it until Arc has a canonical testnet USDT.
const PAIRS = [
  { pairId: 0, base: "EURC", quote: "USDC", tickSize: "100", lotSize: "1000000" },
];

app.get("/api/pairs", (c) => c.json(PAIRS));

app.get("/api/book/:pairId", (c) => {
  const pairId = Number(c.req.param("pairId"));
  const rows = rawDb
    .prepare(
      `SELECT is_bid AS isBid, price, SUM(CAST(remaining AS INTEGER)) AS qty
       FROM orders
       WHERE pair_id = ? AND status = 'open' AND CAST(remaining AS INTEGER) > 0
       GROUP BY is_bid, price`,
    )
    .all(pairId) as { isBid: number; price: string; qty: number }[];

  const bids = rows
    .filter((r) => r.isBid === 1)
    .sort((a, b) => Number(b.price) - Number(a.price))
    .map((r) => ({ price: r.price, qty: r.qty.toString() }));
  const asks = rows
    .filter((r) => r.isBid === 0)
    .sort((a, b) => Number(a.price) - Number(b.price))
    .map((r) => ({ price: r.price, qty: r.qty.toString() }));

  return c.json({
    pairId,
    bestBid: bids[0]?.price ?? null,
    bestAsk: asks[0]?.price ?? null,
    bids,
    asks,
  });
});

app.get("/api/trades/:pairId", (c) => {
  const pairId = Number(c.req.param("pairId"));
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 500);
  const rows = rawDb
    .prepare(
      `SELECT price, qty, taker_is_bid AS takerIsBid, tx_hash AS txHash, block_number AS blockNumber, log_index AS logIndex, timestamp
       FROM trades WHERE pair_id = ? ORDER BY block_number DESC, log_index DESC LIMIT ?`,
    )
    .all(pairId, limit);
  return c.json(rows);
});

const INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

app.get("/api/candles/:pairId", (c) => {
  const pairId = Number(c.req.param("pairId"));
  const interval = c.req.query("interval") ?? "1m";
  const intervalSec = INTERVAL_SECONDS[interval];
  if (!intervalSec) return c.json({ error: `unsupported interval, use one of: ${Object.keys(INTERVAL_SECONDS).join(", ")}` }, 400);
  const limit = Math.min(Number(c.req.query("limit") ?? 200), 1000);

  const rows = rawDb
    .prepare(
      `WITH bucketed AS (
         SELECT
           (timestamp / @intervalSec) * @intervalSec AS bucket,
           CAST(price AS INTEGER) AS price_i,
           CAST(qty AS INTEGER) AS qty_i,
           timestamp,
           ROW_NUMBER() OVER (PARTITION BY (timestamp / @intervalSec) ORDER BY timestamp ASC, id ASC) AS rn_asc,
           ROW_NUMBER() OVER (PARTITION BY (timestamp / @intervalSec) ORDER BY timestamp DESC, id DESC) AS rn_desc
         FROM trades
         WHERE pair_id = @pairId
       )
       SELECT
         bucket,
         MAX(CASE WHEN rn_asc = 1 THEN price_i END) AS open,
         MAX(price_i) AS high,
         MIN(price_i) AS low,
         MAX(CASE WHEN rn_desc = 1 THEN price_i END) AS close,
         SUM(qty_i) AS volume,
         COUNT(*) AS tradeCount
       FROM bucketed
       GROUP BY bucket
       ORDER BY bucket DESC
       LIMIT @limit`,
    )
    .all({ pairId, intervalSec, limit });

  return c.json(rows.reverse());
});

app.get("/api/orders/:owner", (c) => {
  const owner = c.req.param("owner");
  const rows = rawDb
    .prepare(
      `SELECT order_id AS orderId, pair_id AS pairId, is_bid AS isBid, price, qty, remaining, status,
              placed_tx AS placedTx, placed_at AS placedAt, updated_at AS updatedAt
       FROM orders WHERE LOWER(owner) = LOWER(?) ORDER BY placed_at DESC`,
    )
    .all(owner);
  return c.json(rows);
});

app.get("/api/fills/:owner", (c) => {
  const owner = c.req.param("owner");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 500);
  const rows = rawDb
    .prepare(
      `SELECT order_id AS orderId, maker, taker, price, qty, fee, tx_hash AS txHash,
              block_number AS blockNumber, log_index AS logIndex, timestamp
       FROM fills WHERE LOWER(maker) = LOWER(?) OR LOWER(taker) = LOWER(?)
       ORDER BY block_number DESC, log_index DESC LIMIT ?`,
    )
    .all(owner, owner, limit);
  return c.json(rows);
});

app.get("/api/reserve/apy", (c) => {
  const snapshots = rawDb
    .prepare(
      `SELECT block_number AS blockNumber, timestamp, total_assets AS totalAssets,
              total_supply AS totalSupply, share_price_1e18 AS sharePrice1e18
       FROM reserve_snapshots ORDER BY timestamp ASC`,
    )
    .all() as { blockNumber: number; timestamp: number; totalAssets: string; totalSupply: string; sharePrice1e18: string }[];

  if (snapshots.length < 2) {
    return c.json({ apyPct: null, series: snapshots, note: "not enough snapshots yet for an APY estimate" });
  }

  const first = snapshots[0];
  const latest = snapshots[snapshots.length - 1];
  const firstPrice = BigInt(first.sharePrice1e18);
  const latestPrice = BigInt(latest.sharePrice1e18);
  const elapsedSeconds = latest.timestamp - first.timestamp;

  if (firstPrice === 0n || elapsedSeconds <= 0) {
    return c.json({ apyPct: null, series: snapshots, note: "insufficient data for an APY estimate" });
  }

  const growth = Number(latestPrice - firstPrice) / Number(firstPrice);
  const elapsedYears = elapsedSeconds / (365.25 * 24 * 60 * 60);
  const apyPct = (growth / elapsedYears) * 100;

  return c.json({
    apyPct,
    dataPoints: snapshots.length,
    elapsedHours: elapsedSeconds / 3600,
    series: snapshots,
    note: "real historical series (this indexer), replacing the engine's naive 2-point extrapolation",
  });
});

app.get("/api/stats", (c) => {
  const pairId = c.req.query("pairId") ? Number(c.req.query("pairId")) : undefined;
  const tradeStats = (pairId === undefined
    ? rawDb.prepare(`SELECT COUNT(*) AS tradeCount, SUM(CAST(qty AS INTEGER)) AS totalVolume FROM trades`).get()
    : rawDb.prepare(`SELECT COUNT(*) AS tradeCount, SUM(CAST(qty AS INTEGER)) AS totalVolume FROM trades WHERE pair_id = ?`).get(pairId)) as {
    tradeCount: number; totalVolume: number | null;
  };
  const feeStats = rawDb.prepare(`SELECT SUM(CAST(fee AS INTEGER)) AS totalFees FROM fills`).get() as { totalFees: number | null };
  const openOrders = (pairId === undefined
    ? rawDb.prepare(`SELECT COUNT(*) AS count FROM orders WHERE status = 'open'`).get()
    : rawDb.prepare(`SELECT COUNT(*) AS count FROM orders WHERE status = 'open' AND pair_id = ?`).get(pairId)) as { count: number };

  return c.json({ ...tradeStats, ...feeStats, openOrders: openOrders.count });
});

export function startServer() {
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    logger.info({ port: info.port }, "indexer REST API listening");
  });
}
