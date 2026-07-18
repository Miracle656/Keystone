/**
 * Continuation of demo-router-roundtrip.ts: steps 1-5 already succeeded on-chain
 * (bridge + deposit + scripted trade fill all confirmed) — this just completes the
 * final withdraw-to-Arbitrum-Sepolia leg using DEMO_USER's already-confirmed idle
 * USDC balance, so we don't need to repeat (and pay gas + testnet USDC for) the
 * bridge and trade steps a second time just because of an RPC rate-limit on the
 * last step.
 */
import { loadWallet } from "./lib/wallets.js";
import { balanceManagerBalance } from "./lib/arc.js";
import { withdrawToChain } from "./router/withdraw.js";
import { USDC_ADDRESS } from "./router/addresses.js";
import { logger, explorerTxUrl } from "./lib/logger.js";
import { formatUnits } from "viem";

async function main() {
  const demoUser = loadWallet("DEMO_USER");
  const idle = await balanceManagerBalance(demoUser.address, USDC_ADDRESS);
  const idleHuman = formatUnits(idle, 6);
  logger.info({ idleUsdc: idleHuman }, "Withdrawing DEMO_USER's remaining idle USDC to Arbitrum Sepolia");

  if (idle === 0n) {
    logger.warn("No idle USDC to withdraw.");
    return;
  }

  const { withdrawHash, bridgeResult } = await withdrawToChain({
    privateKey: demoUser.privateKey,
    token: USDC_ADDRESS,
    amountHuman: idleHuman,
    destinationChain: "Arbitrum_Sepolia",
  });
  logger.info(
    { withdrawTxUrl: explorerTxUrl("Arc Testnet", withdrawHash), bridgeState: bridgeResult.state },
    "Withdraw + bridge to Arbitrum Sepolia complete",
  );
}

main().catch((err) => {
  logger.error({ err }, "demo-router-withdraw-only: failed");
  process.exit(1);
});
