import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

/** All bigint-valued on-chain quantities (order ids, prices, qtys) are stored as decimal
 * strings — SQLite has no native uint256, and text avoids silent precision loss that a
 * `real` column would introduce. */

export const orders = sqliteTable("orders", {
  orderId: text("order_id").primaryKey(),
  owner: text("owner").notNull(),
  pairId: integer("pair_id").notNull(),
  isBid: integer("is_bid", { mode: "boolean" }).notNull(),
  price: text("price").notNull(),
  qty: text("qty").notNull(),
  remaining: text("remaining").notNull(),
  flags: integer("flags").notNull(),
  /** 'open' | 'filled' | 'canceled' */
  status: text("status").notNull(),
  placedBlock: integer("placed_block").notNull(),
  placedTx: text("placed_tx").notNull(),
  placedAt: integer("placed_at").notNull(),
  updatedBlock: integer("updated_block").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => ({
  ownerIdx: index("orders_owner_idx").on(t.owner),
  pairStatusIdx: index("orders_pair_status_idx").on(t.pairId, t.status, t.isBid, t.price),
}));

/** Anonymized public trade tape, straight from `TradeExecuted` — no owner/maker/taker
 * identity, matching what the event itself exposes. Depth chart + candles both read this. */
export const trades = sqliteTable("trades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pairId: integer("pair_id").notNull(),
  price: text("price").notNull(),
  qty: text("qty").notNull(),
  takerIsBid: integer("taker_is_bid", { mode: "boolean" }).notNull(),
  blockNumber: integer("block_number").notNull(),
  logIndex: integer("log_index").notNull(),
  txHash: text("tx_hash").notNull(),
  timestamp: integer("timestamp").notNull(),
}, (t) => ({
  txLogIdx: uniqueIndex("trades_tx_log_idx").on(t.txHash, t.logIndex),
  pairTimeIdx: index("trades_pair_time_idx").on(t.pairId, t.timestamp),
}));

/** Per-fill maker/taker/fee detail from `OrderFilled` — identity-attributed, used for a
 * user's own fill history and fee accounting (not the public tape; see `trades` for that). */
export const fills = sqliteTable("fills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull(),
  maker: text("maker").notNull(),
  taker: text("taker").notNull(),
  price: text("price").notNull(),
  qty: text("qty").notNull(),
  fee: text("fee").notNull(),
  blockNumber: integer("block_number").notNull(),
  logIndex: integer("log_index").notNull(),
  txHash: text("tx_hash").notNull(),
  timestamp: integer("timestamp").notNull(),
}, (t) => ({
  txLogIdx: uniqueIndex("fills_tx_log_idx").on(t.txHash, t.logIndex),
  makerIdx: index("fills_maker_idx").on(t.maker),
  takerIdx: index("fills_taker_idx").on(t.taker),
}));

/** Periodic KeystoneReserve NAV samples (totalAssets/totalSupply polled on a timer, not
 * event-derived) — gives `/api/reserve/apy` a real historical series instead of the
 * engine's naive two-point extrapolation. */
export const reserveSnapshots = sqliteTable("reserve_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  blockNumber: integer("block_number").notNull(),
  timestamp: integer("timestamp").notNull(),
  totalAssets: text("total_assets").notNull(),
  totalSupply: text("total_supply").notNull(),
  sharePrice1e18: text("share_price_1e18").notNull(),
}, (t) => ({
  timeIdx: index("reserve_snapshots_time_idx").on(t.timestamp),
}));

/** Singleton (id always 1) — last block whose logs are fully committed to the tables
 * above. Advanced only inside the same DB transaction as the rows it covers, so a crash
 * mid-batch never leaves it ahead of what's actually persisted. */
export const indexerState = sqliteTable("indexer_state", {
  id: integer("id").primaryKey(),
  lastIndexedBlock: integer("last_indexed_block").notNull(),
});
