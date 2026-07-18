import { createPublicClient, fallback, http } from "viem";
import { ARC_TESTNET } from "@keystone/shared";

/** Same multi-provider fallback as packages/engine/src/lib/arc.ts — Arc's default RPC
 * rate-limits aggressively under sustained polling, which is exactly what an indexer does. */
const arcTransport = fallback([
  http(ARC_TESTNET.rpcUrls.default.http[0]),
  http(ARC_TESTNET.rpcUrls.blockdaemon.http[0]),
  http(ARC_TESTNET.rpcUrls.drpc.http[0]),
  http(ARC_TESTNET.rpcUrls.quicknode.http[0]),
]);

export function arcPublicClient() {
  return createPublicClient({ transport: arcTransport, pollingInterval: 2000 });
}
