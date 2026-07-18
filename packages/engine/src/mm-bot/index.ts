/**
 * Market-maker bot: quotes a symmetric, inventory-skewed bid/ask around the
 * MockOracle mid on USDC/EURC, cancel-replacing on a refresh interval. Modes:
 *   simulate  — compute + log intended quotes, no chain writes at all
 *   run-once  — one real cancel-replace cycle, then exit
 *   cron      — repeat cancel-replace every REFRESH_INTERVAL_MS until killed
 *
 * Restart-safety: on startup, reconciles against its own last-known resting
 * orders (persisted locally, see lib/bot-state.ts) and cancels any still active
 * before quoting fresh — safe to kill and restart at any point.
 */
import { parseUnits, formatUnits } from "viem";
import type { WalletName } from "../lib/wallets.js";
import { loadWallet } from "../lib/wallets.js";
import {
  depositToBalanceManager,
  placeLimit,
  cancelOrder,
  balanceManagerBalance,
  walletBalance,
  getOrder,
  bestBidAsk,
  getOracleMid,
} from "../lib/arc.js";
import { computeQuote } from "../lib/quoting.js";
import { reconcileAndCancel } from "../lib/idempotency.js";
import { loadBotState, saveBotState, type BotState } from "../lib/bot-state.js";
import { parseArg, parseMode, sleep } from "../lib/cli.js";
import { logger, explorerTxUrl } from "../lib/logger.js";
import { USDC_ADDRESS, EURC_ADDRESS, MOCK_ORACLE_ADDRESS, USDC_EURC_PAIR_ID } from "../router/addresses.js";

const TICK = 100n;
const LOT = 1_000_000n;
const FLAG_POST_ONLY = 1;

interface BotConfig {
  walletName: WalletName;
  spreadBps: number;
  orderSizeLots: number;
  refreshIntervalMs: number;
  maxSkewShadeBps: number;
  targetWorkingCapital: bigint; // per asset, asset-wei (6dp)
}

function loadConfig(): BotConfig {
  const walletName = parseArg("wallet") as WalletName | undefined;
  if (!walletName) throw new Error("Missing --wallet=MM_BOT_A|MM_BOT_B");
  return {
    walletName,
    spreadBps: Number(parseArg("spreadBps", "MM_SPREAD_BPS") ?? 20),
    orderSizeLots: Number(parseArg("orderSize", "MM_ORDER_SIZE_LOTS") ?? 1),
    refreshIntervalMs: Number(parseArg("refreshMs", "MM_REFRESH_INTERVAL_MS") ?? 15_000),
    maxSkewShadeBps: Number(parseArg("maxSkewBps", "MM_MAX_SKEW_SHADE_BPS") ?? 15),
    targetWorkingCapital: parseUnits(parseArg("workingCapital", "MM_WORKING_CAPITAL") ?? "5", 6),
  };
}

/** Tops up BalanceManager from the bot's own wallet if below target — a bot funds
 * its own quoting capital; it doesn't rely on an external setup step. */
async function ensureWorkingCapital(wallet: ReturnType<typeof loadWallet>, config: BotConfig) {
  for (const token of [USDC_ADDRESS, EURC_ADDRESS] as const) {
    const idle = await balanceManagerBalance(wallet.address, token);
    if (idle >= config.targetWorkingCapital) continue;
    const shortfall = config.targetWorkingCapital - idle;
    const available = await walletBalance(wallet.address, token);
    const topUp = shortfall < available ? shortfall : available;
    if (topUp === 0n) {
      logger.warn({ token, wallet: wallet.name }, "no wallet balance available to top up working capital");
      continue;
    }
    logger.info({ token, amount: formatUnits(topUp, 6), wallet: wallet.name }, "topping up BalanceManager working capital");
    const hash = await depositToBalanceManager(wallet.account, token, topUp);
    logger.info({ txUrl: explorerTxUrl("Arc Testnet", hash) }, "working capital deposit confirmed");
  }
}

/** Cancels any orders this bot believes are still resting from a prior run/cycle. */
async function cancelTracked(wallet: ReturnType<typeof loadWallet>, state: BotState) {
  const { canceled, skipped } = await reconcileAndCancel(
    state.activeOrderIds,
    getOrder,
    async (id) => {
      const hash = await cancelOrder(wallet.account, id);
      logger.info({ orderId: id.toString(), txUrl: explorerTxUrl("Arc Testnet", hash) }, "canceled resting order");
    },
  );
  if (skipped.length > 0) logger.info({ skipped }, "skipped already-inactive tracked orders");
  return canceled;
}

async function runCycle(wallet: ReturnType<typeof loadWallet>, config: BotConfig, mode: string, priorState: BotState): Promise<BotState> {
  const mid = await getOracleMid(MOCK_ORACLE_ADDRESS, EURC_ADDRESS, USDC_ADDRESS);
  const midScaled = mid / 1_000_000_000_000n; // oracle is 1e18-scaled; book price is 1e6-scaled
  const idleQuote = await balanceManagerBalance(wallet.address, USDC_ADDRESS);
  const idleBase = await balanceManagerBalance(wallet.address, EURC_ADDRESS);

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
      wallet: wallet.name,
      mid: midScaled.toString(),
      bid: quote.bidPrice.toString(),
      ask: quote.askPrice.toString(),
      skewFractionBps: quote.skewFractionBps,
      idleQuote: formatUnits(idleQuote, 6),
      idleBase: formatUnits(idleBase, 6),
    },
    "computed quote",
  );

  if (mode === "simulate") {
    logger.info("SIMULATE mode — no orders placed or canceled");
    return priorState;
  }

  await cancelTracked(wallet, priorState);

  const { bid: bestBid, ask: bestAsk } = await bestBidAsk(USDC_EURC_PAIR_ID);
  const newOrderIds: string[] = [];

  // POST_ONLY reverts (WouldCross) if our computed price happens to cross another
  // resting order — e.g. the other mm-bot's quote. That's an expected, non-fatal
  // outcome (just means this side sits out the cycle), not a reason to crash the
  // whole bot — each side is placed independently and failures are logged, not
  // thrown.
  try {
    const bidResult = await placeLimit(wallet.account, USDC_EURC_PAIR_ID, true, quote.bidPrice, quote.bidQty, FLAG_POST_ONLY, bestBid);
    logger.info(
      { txUrl: explorerTxUrl("Arc Testnet", bidResult.hash), price: quote.bidPrice.toString(), orderId: bidResult.orderId.toString() },
      "placed bid",
    );
    newOrderIds.push(bidResult.orderId.toString());
  } catch (err) {
    logger.warn({ err, price: quote.bidPrice.toString() }, "bid placement failed this cycle (likely WouldCross), skipping");
  }

  try {
    const askResult = await placeLimit(wallet.account, USDC_EURC_PAIR_ID, false, quote.askPrice, quote.askQty, FLAG_POST_ONLY, bestAsk);
    logger.info(
      { txUrl: explorerTxUrl("Arc Testnet", askResult.hash), price: quote.askPrice.toString(), orderId: askResult.orderId.toString() },
      "placed ask",
    );
    newOrderIds.push(askResult.orderId.toString());
  } catch (err) {
    logger.warn({ err, price: quote.askPrice.toString() }, "ask placement failed this cycle (likely WouldCross), skipping");
  }

  return { activeOrderIds: newOrderIds };
}

async function main() {
  const config = loadConfig();
  const mode = parseMode("run-once");
  const wallet = loadWallet(config.walletName);

  logger.info({ wallet: wallet.name, address: wallet.address, mode, config: { ...config, targetWorkingCapital: config.targetWorkingCapital.toString() } }, "mm-bot starting");

  if (mode !== "simulate") {
    await ensureWorkingCapital(wallet, config);
  }

  let state = loadBotState(config.walletName);
  if (mode !== "simulate") {
    await cancelTracked(wallet, state);
    state = { activeOrderIds: [] };
    saveBotState(config.walletName, state);
  }

  do {
    state = await runCycle(wallet, config, mode, state);
    if (mode !== "simulate") saveBotState(config.walletName, state);
    if (mode === "cron") await sleep(config.refreshIntervalMs);
  } while (mode === "cron");

  logger.info({ wallet: wallet.name }, "mm-bot cycle(s) complete");
}

main().catch((err) => {
  logger.error({ err }, "mm-bot: fatal error");
  process.exit(1);
});
