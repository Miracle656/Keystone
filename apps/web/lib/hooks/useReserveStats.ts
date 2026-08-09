"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { KEYSTONE_RESERVE_ABI } from "@keystone/shared";
import { KEYSTONE_RESERVE_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";
import { indexer } from "@/lib/indexer";

export function useReserveTVL() {
  // Explicit chainId — KeystoneReserve only exists on Arc, but this hook renders on the Earn
  // page regardless of which chain the connected wallet currently has active (e.g. right after
  // a cross-chain Router flow left it on Base/Arbitrum), so it must not default to that.
  const { data: totalAssets } = useReadContract({
    address: KEYSTONE_RESERVE_ADDRESS,
    abi: KEYSTONE_RESERVE_ABI,
    functionName: "totalAssets",
    chainId: arcTestnet.id,
    query: { refetchInterval: 15_000 },
  });
  // totalAssets is a real 0n when the Reserve genuinely holds nothing yet — must not collapse
  // that into the same "…" as still-loading (undefined), or a correctly-empty vault reads as
  // permanently stuck loading.
  return totalAssets === undefined ? null : Number(totalAssets) / 1e6;
}

/** The connected wallet's own Reserve position — distinct from useReserveTVL, which is the
 * whole pool. TVL already includes everyone's deposits (including this user's), so it alone
 * can't answer "did my deposit register" — this is the number that can. Same shares/sharePrice
 * math as usePortfolio.ts's reserve block, factored out so Earn can show it too, not just
 * Portfolio. */
export function useMyReservePosition() {
  const { address, isConnected } = useAccount();
  const { data } = useReadContracts({
    contracts: [
      { address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "balanceOf", args: address ? [address] : undefined, chainId: arcTestnet.id },
      { address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "totalAssets", chainId: arcTestnet.id },
      { address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "totalSupply", chainId: arcTestnet.id },
    ],
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  const shares = data?.[0]?.status === "success" ? (data[0].result as bigint) : 0n;
  const totalAssets = data?.[1]?.status === "success" ? (data[1].result as bigint) : 0n;
  const totalSupply = data?.[2]?.status === "success" ? (data[2].result as bigint) : 0n;
  const sharePrice = totalSupply === 0n ? 1 : Number(totalAssets) / Number(totalSupply);

  return {
    isConnected,
    shares: Number(shares) / 1e6,
    sharePrice,
    valueUsd: (Number(shares) / 1e6) * sharePrice,
  };
}

export function useReserveFeesCaptured() {
  return useQuery({
    queryKey: ["reserve-fills", KEYSTONE_RESERVE_ADDRESS],
    queryFn: async () => {
      const fills = await indexer.fillsByOwner(KEYSTONE_RESERVE_ADDRESS, 500);
      const asMaker = fills.filter((f) => f.maker.toLowerCase() === KEYSTONE_RESERVE_ADDRESS.toLowerCase());
      const totalFeeCaptured = asMaker.reduce((sum, f) => sum + Number(f.fee), 0) / 1e6;
      return { fillCount: asMaker.length, totalFeeCaptured };
    },
    refetchInterval: 15_000,
  });
}

export type YieldRange = "D" | "W" | "M";

/** Buckets the Reserve's real NAV-snapshot series (see indexer's reserve_snapshots) into a
 * small number of real bars — no synthetic data. With a fresh testnet vault this will mostly
 * be flat/near-zero, which is the honest answer, not a shortcoming to paper over. */
export function useYieldHistory(range: YieldRange) {
  return useQuery({
    queryKey: ["reserve-yield-history", range],
    queryFn: async () => {
      const { series } = await indexer.reserveApy();
      if (series.length < 2) return [];

      const bucketSeconds = range === "D" ? 3600 : range === "W" ? 6 * 3600 : 24 * 3600;
      const bucketCount = 24;
      const latestTs = series[series.length - 1].timestamp;
      const buckets: { label: number; deltaUsd: number }[] = Array.from({ length: bucketCount }, (_, i) => ({
        label: latestTs - (bucketCount - 1 - i) * bucketSeconds,
        deltaUsd: 0,
      }));

      for (let i = 1; i < series.length; i++) {
        const prev = series[i - 1];
        const cur = series[i];
        const deltaAssets = (Number(cur.totalAssets) - Number(prev.totalAssets)) / 1e6;
        if (deltaAssets === 0) continue;
        const bucketIndex = Math.min(bucketCount - 1, Math.max(0, Math.floor((cur.timestamp - buckets[0].label) / bucketSeconds)));
        buckets[bucketIndex].deltaUsd += deltaAssets;
      }
      return buckets;
    },
    refetchInterval: 20_000,
  });
}
