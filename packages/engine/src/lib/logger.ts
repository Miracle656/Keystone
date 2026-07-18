import pino from "pino";
import { ARC_TESTNET, BASE_SEPOLIA, ARBITRUM_SEPOLIA } from "@keystone/shared";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
});

const EXPLORERS: Record<string, string> = {
  "Arc Testnet": ARC_TESTNET.blockExplorers.default.url,
  Arc_Testnet: ARC_TESTNET.blockExplorers.default.url,
  "Base Sepolia": BASE_SEPOLIA.blockExplorer,
  Base_Sepolia: BASE_SEPOLIA.blockExplorer,
  "Arbitrum Sepolia": ARBITRUM_SEPOLIA.blockExplorer,
  Arbitrum_Sepolia: ARBITRUM_SEPOLIA.blockExplorer,
};

/** Builds an explorer tx link for structured logs, regardless of over-/under-scored chain name. */
export function explorerTxUrl(chainName: string, txHash: string): string {
  const base = EXPLORERS[chainName];
  if (!base) return txHash;
  return `${base}/tx/${txHash}`;
}
