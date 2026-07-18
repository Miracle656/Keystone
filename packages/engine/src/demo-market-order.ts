/** Phase 3 DoD: DEMO_USER places a market SELL of EURC against the live two-sided book
 * (both mm-bots + KeystoneReserve resting bids), timing the fill. */
import { formatUnits } from "viem";
import { loadWallet } from "./lib/wallets.js";
import { placeMarket, bestBidAsk } from "./lib/arc.js";
import { USDC_EURC_PAIR_ID } from "./router/addresses.js";
import { logger, explorerTxUrl } from "./lib/logger.js";

async function main() {
  const demoUser = loadWallet("DEMO_USER");
  const qty = 1_000_000n; // 1 EURC
  const worstPrice = 1_000_000n; // accept down to 1.00 USDC/EURC (well below best bid)

  const before = await bestBidAsk(USDC_EURC_PAIR_ID);
  logger.info({ bestBid: before.bid.toString(), bestAsk: before.ask.toString() }, "book state before market order");

  const start = Date.now();
  const { hash, orderId, fills } = await placeMarket(demoUser.account, USDC_EURC_PAIR_ID, false, qty, worstPrice);
  const elapsedMs = Date.now() - start;

  logger.info(
    {
      orderId: orderId.toString(),
      txUrl: explorerTxUrl("Arc Testnet", hash),
      elapsedMs,
      fillCount: fills.length,
      fills: fills.map((f) => ({
        maker: f.args.maker,
        price: f.args.price.toString(),
        qty: formatUnits(f.args.qty, 6),
        fee: formatUnits(f.args.fee, 6),
      })),
    },
    "market order filled",
  );

  const after = await bestBidAsk(USDC_EURC_PAIR_ID);
  logger.info({ bestBid: after.bid.toString(), bestAsk: after.ask.toString() }, "book state after market order");
}

main().catch((err) => {
  logger.error({ err }, "demo-market-order: failed");
  process.exit(1);
});
