import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { createSolanaAdapterFromProvider } from "@circle-fin/adapter-solana";
import { AppKit, BridgeChain, isRetryableError } from "@circle-fin/app-kit";
import type { EIP1193Provider } from "viem";
import type { SolanaProvider } from "@/lib/hooks/useSolanaWallet";

export { BridgeChain, isRetryableError };

/** Browser counterpart to packages/engine/src/lib/appkit.ts's createEngineAdapter — same
 * App Kit surface, but wraps the connected wallet's injected EIP-1193 provider (from wagmi)
 * instead of a raw private key, so the user signs every step themselves. */
export function createBrowserAdapter(provider: EIP1193Provider) {
  return createViemAdapterFromProvider({ provider });
}

/** Solana counterpart — wraps the connected Solana wallet's injected provider (Phantom/Solflare,
 * see useSolanaWallet) instead of a raw Keypair, same "user signs every step" model as the EVM
 * adapter above. No capabilities override: the default (user-controlled address context, all
 * chains supported) is exactly what a browser wallet needs. */
export function createSolanaBrowserAdapter(provider: SolanaProvider) {
  return createSolanaAdapterFromProvider({ provider });
}

let kit: AppKit | undefined;

/** Shared AppKit instance — stateless beyond event listeners, safe to reuse. */
export function getAppKit(): AppKit {
  if (!kit) kit = new AppKit();
  return kit;
}
