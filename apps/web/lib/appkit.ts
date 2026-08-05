import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { AppKit, BridgeChain, isRetryableError } from "@circle-fin/app-kit";
import type { EIP1193Provider } from "viem";

export { BridgeChain, isRetryableError };

/** Browser counterpart to packages/engine/src/lib/appkit.ts's createEngineAdapter — same
 * App Kit surface, but wraps the connected wallet's injected EIP-1193 provider (from wagmi)
 * instead of a raw private key, so the user signs every step themselves. */
export function createBrowserAdapter(provider: EIP1193Provider) {
  return createViemAdapterFromProvider({ provider });
}

let kit: AppKit | undefined;

/** Shared AppKit instance — stateless beyond event listeners, safe to reuse. */
export function getAppKit(): AppKit {
  if (!kit) kit = new AppKit();
  return kit;
}
