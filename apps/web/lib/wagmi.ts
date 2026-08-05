import { createConfig, http, fallback, injected } from "wagmi";
import { defineChain } from "viem";
import { baseSepolia, arbitrumSepolia } from "viem/chains";
import { ARC_TESTNET } from "@keystone/shared";

// Same chain definition as packages/shared/src/chains.ts's ARC_TESTNET — duplicated here
// (rather than imported) because wagmi's `defineChain` shape differs slightly from the plain
// object shared package exports, and the web app is the only consumer needing the wagmi form.
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL ?? "https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: process.env.NEXT_PUBLIC_ARCSCAN_URL ?? "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// Arc's default RPC rate-limits aggressively under sustained polling — the same issue already
// fixed in packages/engine/src/lib/arc.ts and appkit.ts, ported here since the Trade page polls
// the book/balances/oracle continuously and the Router modal adds its own allowance/balance
// reads on top. Fall back across every recorded Arc RPC provider instead of hammering one.
const arcTransport = fallback([
  http(ARC_TESTNET.rpcUrls.default.http[0]),
  http(ARC_TESTNET.rpcUrls.blockdaemon.http[0]),
  http(ARC_TESTNET.rpcUrls.drpc.http[0]),
  http(ARC_TESTNET.rpcUrls.quicknode.http[0]),
]);

// Router door chains — Base Sepolia and Arbitrum Sepolia use viem's built-in definitions
// directly (well-known public testnets, no Keystone-specific config needed) so the Router
// modal can read balances and switch chains for the CCTP v2 bridge legs.
export const wagmiConfig = createConfig({
  chains: [arcTestnet, baseSepolia, arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: arcTransport,
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: true,
});
