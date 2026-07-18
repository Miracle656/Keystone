/**
 * Final leg only: DEMO_USER's BalanceManager withdraw already succeeded on-chain
 * (confirmed by their Arc wallet balance) even though the prior run's receipt-wait
 * was rate-limited before it could proceed to the outbound bridge. This just
 * bridges 1 USDC from that same Arc wallet to Arbitrum Sepolia, completing the
 * round-trip's exit leg.
 */
import { loadWallet } from "./lib/wallets.js";
import { createEngineAdapter, getAppKit, BridgeChain } from "./lib/appkit.js";
import { logger, explorerTxUrl } from "./lib/logger.js";

async function main() {
  const demoUser = loadWallet("DEMO_USER");
  const adapter = createEngineAdapter(demoUser.privateKey);
  const kit = getAppKit();
  kit.on("*", (payload) => logger.debug({ payload }, "appkit event"));

  logger.info({ address: demoUser.address, amount: "1" }, "Bridging 1 USDC from Arc to Arbitrum Sepolia");

  let result = await kit.bridge({
    from: { adapter, chain: BridgeChain.Arc_Testnet },
    to: { adapter, chain: BridgeChain.Arbitrum_Sepolia },
    amount: "1",
  });

  if (result.state === "error") {
    logger.warn({ steps: result.steps }, "bridge errored, retrying once");
    result = await kit.retryBridge(result, { from: adapter, to: adapter });
  }

  for (const step of result.steps) {
    if (step.txHash) logger.info({ step: step.name, txUrl: step.explorerUrl ?? step.txHash }, "bridge step");
  }
  logger.info({ state: result.state }, "Bridge to Arbitrum Sepolia complete — round trip finished");
}

main().catch((err) => {
  logger.error({ err }, "demo-router-bridge-out-only: failed");
  process.exit(1);
});
