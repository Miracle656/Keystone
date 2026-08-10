/**
 * Reference feed updater: pushes a real EUR/USD price on-chain into MockOracle,
 * replacing the one-time hardcoded value set at deploy.
 *
 * Why this exists (and why it's still labeled honestly, not oversold):
 * KeystoneBook's matching NEVER reads this — it's pure on-chain price-time
 * priority, unconditionally (see KeystoneBook.sol NatSpec). This feed has
 * exactly two consumers, both outside matching: the mm-bots and reserve-keeper
 * (to know roughly where to center quotes) and KeystoneReserve's NAV math
 * (to value idle EURC in USDC terms). An order book produces prices; it
 * doesn't consume them — piping this into matching would turn Keystone into
 * an oracle-following robot instead of a market.
 *
 * The source is now Pyth's live EUR/USD feed on Arc Testnet (real address,
 * verified live 2026-08-10 — see ARC_TESTNET_CONTRACTS.PYTH in
 * packages/shared/src/chains.ts for exactly how, and DECISIONS.md). That's an
 * upgrade from the previous source (Frankfurter/ECB's REST API): a decentralized,
 * multi-publisher aggregated price instead of a single free HTTP endpoint,
 * fetched with an on-chain read instead of an off-chain API call. Still a
 * single-operator PUSH into MockOracle from there — reading Pyth doesn't by
 * itself make the push step decentralized, only what's being pushed. The
 * contract is still named MockOracle on-chain (renaming it would mean
 * redeploying KeystoneReserve too, since its ORACLE reference is immutable —
 * pure churn for a cosmetic change) but the data flowing through it is a real
 * decentralized-oracle price as of each push.
 */
import { loadWallet } from "../lib/wallets.js";
import { setOracleMid, getOracleMid, getPythEurUsdMid } from "../lib/arc.js";
import { parseMode, sleep } from "../lib/cli.js";
import { logger, explorerTxUrl } from "../lib/logger.js";
import { USDC_ADDRESS, EURC_ADDRESS, MOCK_ORACLE_ADDRESS } from "../router/addresses.js";

const REFRESH_INTERVAL_MS = Number(process.env.REFERENCE_FEED_REFRESH_MS ?? 5 * 60_000); // 5 min default

async function runOnce(mode: string) {
  const mid1e18 = await getPythEurUsdMid();
  logger.info({ eurUsd: Number(mid1e18) / 1e18, mid1e18: mid1e18.toString() }, "read live EUR/USD from Pyth on Arc Testnet");

  if (mode === "simulate") {
    logger.info("SIMULATE mode — would call MockOracle.setMid, not sending a transaction");
    return;
  }

  const deployer = loadWallet("DEPLOYER"); // MockOracle's owner
  const before = await getOracleMid(MOCK_ORACLE_ADDRESS, EURC_ADDRESS, USDC_ADDRESS);
  if (before === mid1e18) {
    logger.info("on-chain mid already matches Pyth's rate, skipping a no-op transaction");
    return;
  }

  const hash = await setOracleMid(deployer.account, MOCK_ORACLE_ADDRESS, EURC_ADDRESS, USDC_ADDRESS, mid1e18);
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", hash), eurUsd: Number(mid1e18) / 1e18 }, "MockOracle.setMid confirmed with Pyth's EUR/USD price");
}

async function main() {
  const mode = parseMode("run-once");
  logger.info({ mode }, "reference-feed updater starting");
  do {
    try {
      await runOnce(mode);
    } catch (err) {
      logger.error({ err }, "reference-feed update failed this cycle");
    }
    if (mode === "cron") await sleep(REFRESH_INTERVAL_MS);
  } while (mode === "cron");
}

main().catch((err) => {
  logger.error({ err }, "reference-feed updater: fatal error");
  process.exit(1);
});
