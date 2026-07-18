import { createConfig, http, injected } from "wagmi";
import { defineChain } from "viem";

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

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});
