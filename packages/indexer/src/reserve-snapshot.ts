import { KEYSTONE_RESERVE_ABI } from "@keystone/shared";
import { arcPublicClient } from "./lib/rpc.js";
import { rawDb } from "./db/client.js";
import { KEYSTONE_RESERVE_ADDRESS, RESERVE_SNAPSHOT_INTERVAL_MS } from "./config.js";
import { logger } from "./lib/logger.js";

const insertSnapshot = rawDb.prepare(`
  INSERT INTO reserve_snapshots (block_number, timestamp, total_assets, total_supply, share_price_1e18)
  VALUES (?, ?, ?, ?, ?)
`);

async function takeSnapshot() {
  const client = arcPublicClient();
  const [totalAssets, totalSupply, block] = await Promise.all([
    client.readContract({ address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "totalAssets" }),
    client.readContract({ address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "totalSupply" }),
    client.getBlock(),
  ]);

  const sharePrice1e18 = totalSupply === 0n ? 0n : (totalAssets * 1_000_000_000_000_000_000n) / totalSupply;

  insertSnapshot.run(
    Number(block.number),
    Number(block.timestamp),
    totalAssets.toString(),
    totalSupply.toString(),
    sharePrice1e18.toString(),
  );
  logger.info({ totalAssets: totalAssets.toString(), totalSupply: totalSupply.toString() }, "reserve NAV snapshot taken");
}

export async function runReserveSnapshotLoop() {
  for (;;) {
    try {
      await takeSnapshot();
    } catch (err) {
      logger.error({ err }, "reserve snapshot failed, will retry next interval");
    }
    await new Promise((r) => setTimeout(r, RESERVE_SNAPSHOT_INTERVAL_MS));
  }
}
