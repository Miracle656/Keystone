import { createPublicClient, createWalletClient, http, fallback, type Account } from "viem";
import { createViemAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";
import { AppKit, BridgeChain } from "@circle-fin/app-kit";
import { ArcTestnet, BaseSepolia, ArbitrumSepolia } from "@circle-fin/app-kit/chains";
import { ARC_TESTNET, BASE_SEPOLIA, ARBITRUM_SEPOLIA } from "@keystone/shared";

export { BridgeChain };

/** chain.name (space-separated, as used by @circle-fin/app-kit/chains) -> our RPC URL(s). */
const RPC_BY_CHAIN_NAME: Record<string, string[]> = {
  // Arc's primary public RPC rate-limits under back-to-back calls (hit repeatedly
  // across this build) — fall back across every recorded provider endpoint
  // (docs.arc.io/arc/tools/node-providers) instead of hammering just one.
  [ArcTestnet.name]: [
    ARC_TESTNET.rpcUrls.default.http[0],
    ARC_TESTNET.rpcUrls.blockdaemon.http[0],
    ARC_TESTNET.rpcUrls.drpc.http[0],
    ARC_TESTNET.rpcUrls.quicknode.http[0],
  ],
  [BaseSepolia.name]: [BASE_SEPOLIA.rpcUrl],
  [ArbitrumSepolia.name]: [ARBITRUM_SEPOLIA.rpcUrl],
};

function urlsFor(chain: { name?: string } | undefined): string[] {
  const name = chain?.name;
  const urls = name ? RPC_BY_CHAIN_NAME[name] : undefined;
  if (!urls) throw new Error(`No RPC configured for chain: ${name ?? "(unknown)"}`);
  return urls;
}

const TRANSPORT_OPTS = { retryCount: 3, retryDelay: 1500, timeout: 20_000 };

function transportFor(chain: { name?: string } | undefined) {
  const urls = urlsFor(chain);
  return urls.length > 1 ? fallback(urls.map((url) => http(url, TRANSPORT_OPTS))) : http(urls[0], TRANSPORT_OPTS);
}

/**
 * One adapter per wallet — a viem private-key adapter works across every EVM chain
 * App Kit supports (per /app-kit/tutorials/adapter-setups), so we don't need one
 * adapter per chain, just one per signer.
 */
export function createEngineAdapter(privateKey: `0x${string}`) {
  return createViemAdapterFromPrivateKey({
    privateKey,
    getPublicClient: ({ chain }) => createPublicClient({ chain, transport: transportFor(chain), pollingInterval: 2000 }),
    getWalletClient: ({ chain, account }: { chain: Parameters<typeof createWalletClient>[0]["chain"]; account: Account }) =>
      createWalletClient({ account, chain, transport: transportFor(chain) }),
  });
}

let kit: AppKit | undefined;

/** Shared AppKit instance — stateless beyond event listeners, safe to reuse. */
export function getAppKit(): AppKit {
  if (!kit) kit = new AppKit();
  return kit;
}
