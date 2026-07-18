/**
 * Reference feed updater: pushes the real live EUR/USD rate on-chain into
 * MockOracle, replacing the one-time hardcoded value set at deploy.
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
 * The data pushed here is now REAL (live EUR/USD from Frankfurter/ECB, a free
 * public API — no key needed), not an invented number. It's still a
 * single-operator push, not a decentralized oracle network (Chainlink/Pyth/
 * Stork are all listed as available on Arc per docs.arc.io/arc/tools/oracles,
 * but a specific live testnet EUR/USD feed address wasn't verified — see
 * DECISIONS.md). The contract is still named MockOracle on-chain (renaming it
 * would mean redeploying KeystoneReserve too, since its ORACLE reference is
 * immutable — pure churn for a cosmetic change) but the data flowing through
 * it is genuine market data as of each push.
 */
import { loadWallet } from "../lib/wallets.js";
import { setOracleMid, getOracleMid } from "../lib/arc.js";
import { parseMode, sleep } from "../lib/cli.js";
import { logger, explorerTxUrl } from "../lib/logger.js";
import { USDC_ADDRESS, EURC_ADDRESS, MOCK_ORACLE_ADDRESS } from "../router/addresses.js";

const REFRESH_INTERVAL_MS = Number(process.env.REFERENCE_FEED_REFRESH_MS ?? 5 * 60_000); // 5 min default

async function fetchEurUsd(): Promise<number> {
  const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD");
  if (!res.ok) throw new Error(`Frankfurter API returned ${res.status}`);
  const body = (await res.json()) as { rates: { USD: number } };
  const rate = body.rates.USD;
  if (!rate || rate <= 0) throw new Error(`Frankfurter API returned an unusable rate: ${rate}`);
  return rate;
}

async function runOnce(mode: string) {
  const rate = await fetchEurUsd();
  const mid1e18 = BigInt(Math.round(rate * 1e18));
  logger.info({ eurUsd: rate, mid1e18: mid1e18.toString() }, "fetched live EUR/USD from Frankfurter (ECB reference rates)");

  if (mode === "simulate") {
    logger.info("SIMULATE mode — would call MockOracle.setMid, not sending a transaction");
    return;
  }

  const deployer = loadWallet("DEPLOYER"); // MockOracle's owner
  const before = await getOracleMid(MOCK_ORACLE_ADDRESS, EURC_ADDRESS, USDC_ADDRESS);
  if (before === mid1e18) {
    logger.info("on-chain mid already matches the live rate, skipping a no-op transaction");
    return;
  }

  const hash = await setOracleMid(deployer.account, MOCK_ORACLE_ADDRESS, EURC_ADDRESS, USDC_ADDRESS, mid1e18);
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", hash), eurUsd: rate }, "MockOracle.setMid confirmed with live EUR/USD data");
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
