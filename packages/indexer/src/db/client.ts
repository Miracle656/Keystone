import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema.js";

const DB_PATH = process.env.INDEXER_DB_PATH ?? "./data/keystone-indexer.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

/** Hand-written DDL instead of drizzle-kit generated migrations — this is a hackathon-speed
 * choice (one less toolchain step), not a long-term pattern. Keep in sync with schema.ts by
 * hand; `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` make re-running safe. */
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    pair_id INTEGER NOT NULL,
    is_bid INTEGER NOT NULL,
    price TEXT NOT NULL,
    qty TEXT NOT NULL,
    remaining TEXT NOT NULL,
    flags INTEGER NOT NULL,
    status TEXT NOT NULL,
    placed_block INTEGER NOT NULL,
    placed_tx TEXT NOT NULL,
    placed_at INTEGER NOT NULL,
    updated_block INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS orders_owner_idx ON orders (owner);
  CREATE INDEX IF NOT EXISTS orders_pair_status_idx ON orders (pair_id, status, is_bid, price);

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair_id INTEGER NOT NULL,
    price TEXT NOT NULL,
    qty TEXT NOT NULL,
    taker_is_bid INTEGER NOT NULL,
    block_number INTEGER NOT NULL,
    log_index INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS trades_tx_log_idx ON trades (tx_hash, log_index);
  CREATE INDEX IF NOT EXISTS trades_pair_time_idx ON trades (pair_id, timestamp);

  CREATE TABLE IF NOT EXISTS fills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    maker TEXT NOT NULL,
    taker TEXT NOT NULL,
    price TEXT NOT NULL,
    qty TEXT NOT NULL,
    fee TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    log_index INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS fills_tx_log_idx ON fills (tx_hash, log_index);
  CREATE INDEX IF NOT EXISTS fills_maker_idx ON fills (maker);
  CREATE INDEX IF NOT EXISTS fills_taker_idx ON fills (taker);

  CREATE TABLE IF NOT EXISTS reserve_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_number INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    total_assets TEXT NOT NULL,
    total_supply TEXT NOT NULL,
    share_price_1e18 TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS reserve_snapshots_time_idx ON reserve_snapshots (timestamp);

  CREATE TABLE IF NOT EXISTS indexer_state (
    id INTEGER PRIMARY KEY,
    last_indexed_block INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
export const rawDb = sqlite;
