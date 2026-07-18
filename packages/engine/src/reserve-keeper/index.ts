/**
 * Reserve keeper: quotes KeystoneReserve's passive liquidity around the MockOracle
 * mid, through the Reserve's own on-chain bounds (max spread, max inventory skew,
 * max order size — enforced by the contract itself, not re-implemented here).
 * Same simulate/run-once/cron modes and restart-safety model as mm-bot.
 *
 * Also estimates and logs the Reserve's current APY from real captured value
 * (share price = totalAssets/totalSupply) — a lightweight local estimate since the
 * Phase 4 indexer (which will do this properly, with real historical persistence)
 * doesn't exist yet.
 */
import { formatUnits } from "viem";
import { loadWallet } from "../lib/wallets.js";
import {
  balanceManagerBalance,
  getOrder,
  bestBidAsk,
  getOracleMid,
  reservePlaceQuote,
  reserveCancelQuote,
  reserveTotalAssetsAndSupply,
} from "../lib/arc.js";
import { computeQuote } from "../lib/quoting.js";
import { reconcileAndCancel } from "../lib/idempotency.js";
import { loadBotState, saveBotState, type BotState } from "../lib/bot-state.js";
import { parseArg, parseMode, sleep } from "../lib/cli.js";
import { logger, explorerTxUrl } from "../lib/logger.js";
import { USDC_ADDRESS, EURC_ADDRESS, MOCK_ORACLE_ADDRESS, USDC_EURC_PAIR_ID, KEYSTONE_RESERVE_ADDRESS } from "../router/addresses.js";
import { loadApyState, saveApyState } from "./apy.js";

const TICK = 100n;
const LOT = 1_000_000n;
const BOT_NAME = "RESERVE_KEEPER_QUOTES"; // distinct from the RESERVE_KEEPER wallet's own state, if it ever trades directly

interface KeeperConfig {
  spreadBps: number;
  orderSizeLots: number;
  refreshIntervalMs: number;
  maxSkewShadeBps: number;
}

function loadConfig(): KeeperConfig {
  return {
    spreadBps: Number(parseArg("spreadBps", "RESERVE_SPREAD_BPS") ?? 30),
    orderSizeLots: Number(parseArg("orderSize", "RESERVE_ORDER_SIZE_LOTS") ?? 1),
    refreshIntervalMs: Number(parseArg("refreshMs", "RESERVE_REFRESH_INTERVAL_MS") ?? 20_000),
    maxSkewShadeBps: Number(parseArg("maxSkewBps", "RESERVE_MAX_SKEW_SHADE_BPS") ?? 10),
  };
}

async function cancelTracked(wallet: ReturnType<typeof loadWallet>, state: BotState) {
  const { canceled, skipped } = await reconcileAndCancel(
    state.activeOrderIds,
    getOrder,
    async (id) => {
      const hash = await reserveCancelQuote(wallet.account, KEYSTONE_RESERVE_ADDRESS, id);
      logger.info({ orderId: id.toString(), txUrl: explorerTxUrl("Arc Testnet", hash) }, "canceled resting reserve quote");
    },
  );
  if (skipped.length > 0) logger.info({ skipped }, "skipped already-inactive tracked orders");
  return canceled;
}

async function logApyEstimate() {
  const { totalAssets, totalSupply } = await reserveTotalAssetsAndSupply(KEYSTONE_RESERVE_ADDRESS);
  if (totalSupply === 0n) {
    logger.info("Reserve has no shares yet (no deposits) — APY not yet meaningful");
    return;
  }
  const sharePrice = (totalAssets * 1_000_000_000_000_000_000n) / totalSupply; // 1e18-scaled

  let apyState = loadApyState();
  const now = Date.now();
  if (!apyState) {
    apyState = { firstObservedAtMs: now, firstSharePrice1e18: sharePrice.toString() };
    saveApyState(apyState);
  }

  const elapsedMs = now - apyState.firstObservedAtMs;
  const firstSharePrice = BigInt(apyState.firstSharePrice1e18);
  if (elapsedMs < 60_000 || firstSharePrice === 0n) {
    logger.info({ totalAssets: totalAssets.toString(), totalSupply: totalSupply.toString() }, "APY: not enough elapsed time yet for a meaningful estimate");
    return;
  }

  const growth = Number(sharePrice - firstSharePrice) / Number(firstSharePrice);
  const elapsedYears = elapsedMs / (365.25 * 24 * 60 * 60 * 1000);
  const apyEstimate = growth / elapsedYears;

  logger.info(
    {
      totalAssets: formatUnits(totalAssets, 6),
      totalSupply: formatUnits(totalSupply, 6),
      sharePrice: formatUnits(sharePrice, 18),
      elapsedHours: (elapsedMs / 3_600_000).toFixed(2),
      apyEstimatePct: (apyEstimate * 100).toFixed(4),
    },
    "SIMULATED APY estimate — naive extrapolation from a short local observation window, not the real historical series Phase 4's indexer will compute",
  );
}

async function runCycle(wallet: ReturnType<typeof loadWallet>, config: KeeperConfig, mode: string, priorState: BotState): Promise<BotState> {
  const mid = await getOracleMid(MOCK_ORACLE_ADDRESS, EURC_ADDRESS, USDC_ADDRESS);
  const midScaled = mid / 1_000_000_000_000n;
  const idleQuote = await balanceManagerBalance(KEYSTONE_RESERVE_ADDRESS, USDC_ADDRESS);
  const idleBase = await balanceManagerBalance(KEYSTONE_RESERVE_ADDRESS, EURC_ADDRESS);

  const quote = computeQuote({
    mid: midScaled,
    spreadBps: config.spreadBps,
    size: BigInt(config.orderSizeLots) * LOT,
    tickSize: TICK,
    inventory: { idleBase, idleQuote },
    maxSkewShadeBps: config.maxSkewShadeBps,
  });

  logger.info(
    {
      mid: midScaled.toString(),
      bid: quote.bidPrice.toString(),
      ask: quote.askPrice.toString(),
      skewFractionBps: quote.skewFractionBps,
      reserveIdleQuote: formatUnits(idleQuote, 6),
      reserveIdleBase: formatUnits(idleBase, 6),
    },
    "reserve-keeper: computed quote",
  );

  await logApyEstimate();

  if (mode === "simulate") {
    logger.info("SIMULATE mode — no quotes placed or canceled");
    return priorState;
  }

  await cancelTracked(wallet, priorState);

  const { bid: bestBid, ask: bestAsk } = await bestBidAsk(USDC_EURC_PAIR_ID);
  const newOrderIds: string[] = [];

  // Bounds (spread/skew/size) are enforced on-chain by KeystoneReserve itself — a
  // rejected quote (PriceOutOfBounds, InventorySkewExceeded, OrderTooLarge) is
  // expected occasionally, not fatal.
  try {
    const bidResult = await reservePlaceQuote(wallet.account, KEYSTONE_RESERVE_ADDRESS, true, quote.bidPrice, quote.bidQty, bestBid);
    logger.info({ txUrl: explorerTxUrl("Arc Testnet", bidResult.hash), orderId: bidResult.orderId.toString() }, "reserve bid placed");
    newOrderIds.push(bidResult.orderId.toString());
  } catch (err) {
    logger.warn({ err }, "reserve bid rejected this cycle, skipping");
  }

  try {
    const askResult = await reservePlaceQuote(wallet.account, KEYSTONE_RESERVE_ADDRESS, false, quote.askPrice, quote.askQty, bestAsk);
    logger.info({ txUrl: explorerTxUrl("Arc Testnet", askResult.hash), orderId: askResult.orderId.toString() }, "reserve ask placed");
    newOrderIds.push(askResult.orderId.toString());
  } catch (err) {
    logger.warn({ err }, "reserve ask rejected this cycle, skipping");
  }

  return { activeOrderIds: newOrderIds };
}

async function main() {
  const config = loadConfig();
  const mode = parseMode("run-once");
  const wallet = loadWallet("RESERVE_KEEPER");

  logger.info({ address: wallet.address, mode, config }, "reserve-keeper starting");

  let state = loadBotState(BOT_NAME);
  if (mode !== "simulate") {
    await cancelTracked(wallet, state);
    state = { activeOrderIds: [] };
    saveBotState(BOT_NAME, state);
  }

  do {
    state = await runCycle(wallet, config, mode, state);
    if (mode !== "simulate") saveBotState(BOT_NAME, state);
    if (mode === "cron") await sleep(config.refreshIntervalMs);
  } while (mode === "cron");

  logger.info("reserve-keeper cycle(s) complete");
}

main().catch((err) => {
  logger.error({ err }, "reserve-keeper: fatal error");
  process.exit(1);
});
