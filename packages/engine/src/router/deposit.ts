import { parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BALANCE_MANAGER_ADDRESS } from "./addresses.js";
import { createEngineAdapter, getAppKit, BridgeChain } from "../lib/appkit.js";
import { depositToBalanceManager } from "../lib/arc.js";
import { logger, explorerTxUrl } from "../lib/logger.js";

export type SourceChain = "Base_Sepolia" | "Arbitrum_Sepolia";

/**
 * Direct Arc deposit door: wallet already holds USDC on Arc, escrow it into
 * BalanceManager. No bridging involved.
 */
export async function depositDirectArc(privateKey: `0x${string}`, token: `0x${string}`, amountHuman: string) {
  const account = privateKeyToAccount(privateKey);
  const amount = parseUnits(amountHuman, 6);
  logger.info({ address: account.address, amount: amountHuman }, "depositDirectArc: starting");
  const hash = await depositToBalanceManager(account, token, amount);
  logger.info({ txUrl: explorerTxUrl("Arc Testnet", hash) }, "depositDirectArc: BalanceManager.deposit confirmed");
  return hash;
}

/**
 * Cross-chain deposit door: bridge USDC from `sourceChain` to the wallet's own Arc
 * address (CCTP v2 via App Kit's bridge()), then — per the custody decision in
 * DECISIONS.md — the SAME wallet signs a second, explicit BalanceManager.deposit
 * call. Two user-signed steps, no custodial intermediary ever attributes funds on
 * the user's behalf.
 */
export async function depositCrossChain(params: {
  privateKey: `0x${string}`;
  sourceChain: SourceChain;
  token: `0x${string}`;
  amountHuman: string;
}) {
  const { privateKey, sourceChain, token, amountHuman } = params;
  const account = privateKeyToAccount(privateKey);
  const adapter = createEngineAdapter(privateKey);
  const kit = getAppKit();

  kit.on("*", (payload) => logger.debug({ payload }, "appkit event"));

  logger.info({ address: account.address, sourceChain, amount: amountHuman }, "depositCrossChain: bridging to Arc");

  // createEngineAdapter (viem private-key adapter) resolves as a single implicit
  // address — App Kit treats it like a user-controlled/connected-wallet adapter,
  // so `address` must be omitted here (passing it throws).
  let result = await kit.bridge({
    from: { adapter, chain: sourceChain },
    to: { adapter, chain: BridgeChain.Arc_Testnet },
    amount: amountHuman,
  });

  if (result.state === "error") {
    logger.warn({ steps: result.steps }, "depositCrossChain: bridge errored, retrying once");
    result = await kit.retryBridge(result, { from: adapter, to: adapter });
  }

  if (result.state !== "success") {
    throw new Error(`Bridge to Arc did not complete: ${JSON.stringify(result.steps)}`);
  }

  for (const step of result.steps) {
    if (step.txHash) logger.info({ step: step.name, txUrl: step.explorerUrl ?? step.txHash }, "depositCrossChain: bridge step");
  }

  const depositHash = await depositDirectArc(privateKey, token, amountHuman);
  return { bridgeResult: result, depositHash };
}

// Re-exported for scripts that need the address without a second lookup.
export { BALANCE_MANAGER_ADDRESS };
