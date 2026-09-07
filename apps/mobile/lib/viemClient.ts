import { createPublicClient, http, formatUnits, erc20Abi } from "viem";
import { ARC_TESTNET_CONTRACTS } from "@keystone/shared";
import { arcTestnet } from "./chain";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export async function readArcBalances(address: `0x${string}`) {
  const [usdc, eurc] = await Promise.all([
    publicClient.readContract({
      address: ARC_TESTNET_CONTRACTS.USDC.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
    publicClient.readContract({
      address: ARC_TESTNET_CONTRACTS.EURC.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  return {
    usdc: formatUnits(usdc, ARC_TESTNET_CONTRACTS.USDC.decimals),
    eurc: formatUnits(eurc, ARC_TESTNET_CONTRACTS.EURC.decimals),
  };
}
