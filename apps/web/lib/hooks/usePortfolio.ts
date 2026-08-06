"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { BALANCE_MANAGER_ABI, KEYSTONE_RESERVE_ABI } from "@keystone/shared";
import { BALANCE_MANAGER_ADDRESS, KEYSTONE_RESERVE_ADDRESS, USDC_ADDRESS, EURC_ADDRESS, USDC_EURC_PAIR_ID } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";
import { useOrdersByOwner, useBook } from "@/lib/hooks/useMarketData";

/** Reads the user's real BalanceManager escrow (USDC + EURC) and KeystoneReserve vault
 * position directly from-chain — same contracts Trade/Earn already write through, just read
 * here. "Locked" per token is derived from the user's own open orders (indexer), since
 * BalanceManager.balanceOf() returns the whole escrowed balance without a free/locked split. */
export function usePortfolio() {
  const { address, isConnected } = useAccount();
  const { data: orders } = useOrdersByOwner(address);
  const { data: book } = useBook(Number(USDC_EURC_PAIR_ID));

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: BALANCE_MANAGER_ADDRESS, abi: BALANCE_MANAGER_ABI, functionName: "balanceOf", args: address ? [address, USDC_ADDRESS] : undefined, chainId: arcTestnet.id },
      { address: BALANCE_MANAGER_ADDRESS, abi: BALANCE_MANAGER_ABI, functionName: "balanceOf", args: address ? [address, EURC_ADDRESS] : undefined, chainId: arcTestnet.id },
      { address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "balanceOf", args: address ? [address] : undefined, chainId: arcTestnet.id },
      { address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "totalAssets", chainId: arcTestnet.id },
      { address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "totalSupply", chainId: arcTestnet.id },
    ],
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  const usdcEscrowed = data?.[0]?.status === "success" ? (data[0].result as bigint) : 0n;
  const eurcEscrowed = data?.[1]?.status === "success" ? (data[1].result as bigint) : 0n;
  const shares = data?.[2]?.status === "success" ? (data[2].result as bigint) : 0n;
  const totalAssets = data?.[3]?.status === "success" ? (data[3].result as bigint) : 0n;
  const totalSupply = data?.[4]?.status === "success" ? (data[4].result as bigint) : 0n;

  const open = (orders ?? []).filter((o) => o.status === "open");
  const usdcLocked = open.filter((o) => o.isBid).reduce((sum, o) => sum + (BigInt(o.remaining) * BigInt(o.price)) / 1_000_000n, 0n);
  const eurcLocked = open.filter((o) => !o.isBid).reduce((sum, o) => sum + BigInt(o.remaining), 0n);

  const sharePrice = totalSupply === 0n ? 1 : Number(totalAssets) / Number(totalSupply);
  const reserveValueUsd = (Number(shares) / 1e6) * sharePrice;

  // Mid price for USDC/EURC, used only to fold EURC into a single USD total-value figure —
  // falls back to 1:1 if the book has no quotes yet (fresh testnet pair).
  const bestBid = book?.bestBid ? Number(formatUnits(BigInt(book.bestBid), 6)) : null;
  const bestAsk = book?.bestAsk ? Number(formatUnits(BigInt(book.bestAsk), 6)) : null;
  const eurcMid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid ?? bestAsk ?? 1;

  const usdcHuman = Number(formatUnits(usdcEscrowed, 6));
  const eurcHuman = Number(formatUnits(eurcEscrowed, 6));
  const bookValueUsd = usdcHuman + eurcHuman * eurcMid;
  const totalValueUsd = bookValueUsd + reserveValueUsd;

  return {
    isConnected,
    isLoading,
    totalValueUsd,
    bookValueUsd,
    reserveValueUsd,
    usdc: { escrowed: usdcHuman, locked: Number(formatUnits(usdcLocked, 6)), free: Number(formatUnits(usdcEscrowed - usdcLocked, 6)) },
    eurc: { escrowed: eurcHuman, locked: Number(formatUnits(eurcLocked, 6)), free: Number(formatUnits(eurcEscrowed - eurcLocked, 6)) },
    reserve: { shares: Number(shares) / 1e6, sharePrice, valueUsd: reserveValueUsd },
    openOrders: open,
  };
}
