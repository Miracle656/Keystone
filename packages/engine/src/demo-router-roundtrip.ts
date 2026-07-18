/**
 * Phase 2 DoD: a scripted round-trip proven on testnet — USDC leaves Base Sepolia,
 * is credited on Keystone, trades against a scripted counter-order, and withdraws
 * to Arbitrum Sepolia. Every step logs a structured entry with an explorer link.
 *
 * Run: pnpm --filter @keystone/engine exec tsx src/demo-router-roundtrip.ts
 */
import { formatUnits, parseUnits } from "viem";
import { loadWallet } from "./lib/wallets.js";
import { depositToBalanceManager, placeLimit, balanceManagerBalance } from "./lib/arc.js";
import { depositCrossChain } from "./router/deposit.js";
import { withdrawToChain } from "./router/withdraw.js";
import { USDC_ADDRESS, EURC_ADDRESS } from "./router/addresses.js";
import { logger, explorerTxUrl } from "./lib/logger.js";

const PAIR_ID = 0n; // USDC/EURC
const PRICE = 1_080_000n; // 1.08, matches the seeded MockOracle mid
const LOT = 1_000_000n; // 1.0

async function main() {
  logger.info("=== Keystone Router round-trip demo: Base Sepolia -> Arc -> trade -> Arbitrum Sepolia ===");

  const demoUser = loadWallet("DEMO_USER");
  const mmBotA = loadWallet("MM_BOT_A");

  // ── Step 1+2: bridge USDC from Base Sepolia to Arc, then credit BalanceManager ──
  logger.info({ step: 1 }, "Bridging 2 USDC from Base Sepolia to Arc (DEMO_USER)");
  const { bridgeResult, depositHash } = await depositCrossChain({
    privateKey: demoUser.privateKey,
    sourceChain: "Base_Sepolia",
    token: USDC_ADDRESS,
    amountHuman: "2",
  });
  logger.info(
    { bridgeState: bridgeResult.state, depositTxUrl: explorerTxUrl("Arc Testnet", depositHash) },
    "Step 1+2 complete: bridged and credited to Keystone",
  );

  // ── Step 3: scripted counterparty deposits EURC (already faucet-funded on Arc) ──
  logger.info({ step: 3 }, "MM_BOT_A depositing 2 EURC into BalanceManager (scripted counter-order funding)");
  const mmBotDepositHash = await depositToBalanceManager(mmBotA.account, EURC_ADDRESS, parseUnits("2", 6));
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", mmBotDepositHash) }, "Step 3 complete");

  // ── Step 4: DEMO_USER places a bid with the freshly bridged USDC ──
  logger.info({ step: 4 }, "DEMO_USER placing bid: 1.0 EURC @ 1.08");
  const bid = await placeLimit(demoUser.account, PAIR_ID, true, PRICE, LOT, 0, PRICE);
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", bid.hash) }, "Step 4 complete: bid resting or filled");

  // ── Step 5: scripted counter-order crosses it — a real fill ──
  logger.info({ step: 5 }, "MM_BOT_A placing ask: 2.0 EURC @ 1.08 (crosses resting bid(s))");
  const ask = await placeLimit(mmBotA.account, PAIR_ID, false, PRICE, 2n * LOT, 0, 0n);
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", ask.hash) }, "Step 5 complete: trade executed");

  // ── Step 6+7: withdraw DEMO_USER's remaining idle USDC out to Arbitrum Sepolia ──
  const idle = await balanceManagerBalance(demoUser.address, USDC_ADDRESS);
  const idleHuman = formatUnits(idle, 6);
  logger.info({ step: 6, idleUsdc: idleHuman }, "Withdrawing DEMO_USER's remaining idle USDC to Arbitrum Sepolia");

  if (idle === 0n) {
    logger.warn("No idle USDC left to withdraw — bid consumed the full deposit. Skipping withdraw leg.");
  } else {
    const { withdrawHash, bridgeResult: outBridge } = await withdrawToChain({
      privateKey: demoUser.privateKey,
      token: USDC_ADDRESS,
      amountHuman: idleHuman,
      destinationChain: "Arbitrum_Sepolia",
    });
    logger.info(
      { withdrawTxUrl: explorerTxUrl("Arc Testnet", withdrawHash), bridgeState: outBridge.state },
      "Step 6+7 complete: withdrawn and bridged to Arbitrum Sepolia",
    );
  }

  logger.info("=== Round-trip demo complete ===");
}

main().catch((err) => {
  logger.error({ err }, "demo-router-roundtrip: failed");
  process.exit(1);
});
