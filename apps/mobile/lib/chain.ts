import { defineChain } from "viem";
import { ARC_TESTNET } from "@keystone/shared";

// Same chain definition as apps/web/lib/wagmi.ts's arcTestnet — duplicated for the same reason
// noted there: viem's `defineChain` shape differs from @keystone/shared's plain object, and each
// app needing the wagmi/viem form defines its own rather than sharing a viem-specific export.
export const arcTestnet = defineChain({
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: ARC_TESTNET.nativeCurrency,
  rpcUrls: {
    default: { http: [ARC_TESTNET.rpcUrls.default.http[0]] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: ARC_TESTNET.blockExplorers.default.url },
  },
  testnet: true,
});
