import { parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createEngineAdapter, getAppKit, BridgeChain } from "../lib/appkit.js";
import { withdrawFromBalanceManager } from "../lib/arc.js";
import { logger, explorerTxUrl } from "../lib/logger.js";

export type DestinationChain = "Base_Sepolia" | "Arbitrum_Sepolia";

/**
 * Withdraw-to-any-chain: BalanceManager.withdraw lands real USDC in the wallet's
 * own Arc address first (no attribution ambiguity — it's already the withdrawer's
 * own funds), then the same wallet signs a bridge() to the destination chain.
 * Mirrors the deposit door's two-step, same-wallet-signs-both pattern.
 */
export async function withdrawToChain(params: {
  privateKey: `0x${string}`;
  token: `0x${string}`;
  amountHuman: string;
  destinationChain: DestinationChain;
}) {
  const { privateKey, token, amountHuman, destinationChain } = params;
  const account = privateKeyToAccount(privateKey);
  const amount = parseUnits(amountHuman, 6);

  logger.info({ address: account.address, amount: amountHuman }, "withdrawToChain: withdrawing from BalanceManager");
  const withdrawHash = await withdrawFromBalanceManager(account, token, amount);
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", withdrawHash) }, "withdrawToChain: BalanceManager.withdraw confirmed");

  const adapter = createEngineAdapter(privateKey);
  const kit = getAppKit();
  kit.on("*", (payload) => logger.debug({ payload }, "appkit event"));

  logger.info({ destinationChain, amount: amountHuman }, "withdrawToChain: bridging out of Arc");
  // Same note as deposit.ts: the private-key adapter resolves a single implicit
  // address, so `address` must be omitted from the AdapterContext.
  let result = await kit.bridge({
    from: { adapter, chain: BridgeChain.Arc_Testnet },
    to: { adapter, chain: destinationChain },
    amount: amountHuman,
  });

  if (result.state === "error") {
    logger.warn({ steps: result.steps }, "withdrawToChain: bridge errored, retrying once");
    result = await kit.retryBridge(result, { from: adapter, to: adapter });
  }

  if (result.state !== "success") {
    throw new Error(`Bridge to ${destinationChain} did not complete: ${JSON.stringify(result.steps)}`);
  }

  for (const step of result.steps) {
    if (step.txHash) logger.info({ step: step.name, txUrl: step.explorerUrl ?? step.txHash }, "withdrawToChain: bridge step");
  }

  return { withdrawHash, bridgeResult: result };
}
