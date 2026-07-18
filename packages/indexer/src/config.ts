import type { Address } from "viem";

function requireAddress(name: string): Address {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value as Address;
}

export const KEYSTONE_BOOK_ADDRESS = requireAddress("KEYSTONE_BOOK_ADDRESS");
export const KEYSTONE_RESERVE_ADDRESS = requireAddress("KEYSTONE_RESERVE_ADDRESS");

/** First block containing any Keystone contract activity — see
 * packages/contracts/broadcast/Deploy.s.sol/5042002/run-latest.json (min receipt block
 * 52288791). Starting one block earlier costs nothing and avoids an off-by-one. */
export const DEPLOY_BLOCK = BigInt(process.env.INDEXER_DEPLOY_BLOCK ?? "52288790");

export const POLL_INTERVAL_MS = Number(process.env.INDEXER_POLL_INTERVAL_MS ?? 5000);
export const LOG_BATCH_SIZE = BigInt(process.env.INDEXER_LOG_BATCH_SIZE ?? "2000");
export const RESERVE_SNAPSHOT_INTERVAL_MS = Number(process.env.INDEXER_RESERVE_SNAPSHOT_INTERVAL_MS ?? 60_000);

export const PORT = Number(process.env.INDEXER_PORT ?? 8787);
