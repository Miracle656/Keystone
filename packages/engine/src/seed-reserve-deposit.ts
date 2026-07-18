/** One-off: seed KeystoneReserve with an initial USDC deposit from DEPLOYER, so the
 * reserve-keeper has real capital to quote with (Phase 3). */
import { parseUnits, formatUnits } from "viem";
import { loadWallet } from "./lib/wallets.js";
import { reserveDeposit, reserveTotalAssetsAndSupply } from "./lib/arc.js";
import { USDC_ADDRESS, KEYSTONE_RESERVE_ADDRESS } from "./router/addresses.js";
import { logger, explorerTxUrl } from "./lib/logger.js";

async function main() {
  const deployer = loadWallet("DEPLOYER");
  const amount = process.argv[2] ?? "10";
  const assets = parseUnits(amount, 6);

  logger.info({ address: deployer.address, amount }, "seeding KeystoneReserve with initial deposit");
  const hash = await reserveDeposit(deployer.account, KEYSTONE_RESERVE_ADDRESS, USDC_ADDRESS, assets);
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", hash) }, "reserve deposit confirmed");

  const { totalAssets, totalSupply } = await reserveTotalAssetsAndSupply(KEYSTONE_RESERVE_ADDRESS);
  logger.info({ totalAssets: formatUnits(totalAssets, 6), totalSupply: formatUnits(totalSupply, 6) }, "Reserve state after seeding");
}

main().catch((err) => {
  logger.error({ err }, "seed-reserve-deposit: failed");
  process.exit(1);
});
