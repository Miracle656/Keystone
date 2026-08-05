"use client";

import Image from "next/image";
import { useReadContract } from "wagmi";
import { MOCK_ORACLE_ABI } from "@keystone/shared";
import { MOCK_ORACLE_ADDRESS, EURC_ADDRESS, USDC_ADDRESS } from "@/lib/addresses";
import { use24hStats, useBook } from "@/lib/hooks/useMarketData";
import { formatPrice } from "@/lib/format";

export function PairStatsBar({ pairId }: { pairId: number }) {
  const { data: stats } = use24hStats(pairId);
  const { data: book } = useBook(pairId);
  const { data: oracleMid } = useReadContract({
    address: MOCK_ORACLE_ADDRESS,
    abi: MOCK_ORACLE_ABI,
    functionName: "getMid",
    args: [EURC_ADDRESS, USDC_ADDRESS],
    query: { refetchInterval: 15_000 },
  });

  const spreadBps =
    book?.bestBid && book?.bestAsk ? (((Number(book.bestAsk) - Number(book.bestBid)) / Number(book.bestBid)) * 10000).toFixed(1) : null;
  const changePositive = (stats?.changePct ?? 0) >= 0;

  return (
    <div className="flex h-[56px] flex-none items-center gap-[26px] border-b border-[#1C2028] bg-[#0E1116] px-[18px]">
      <div className="flex items-center gap-2.5">
        <div className="flex">
          <Image src="/brand/usdc.svg" alt="USDC" width={24} height={24} />
          <Image src="/brand/eurc.svg" alt="EURC" width={24} height={24} className="-ml-[7px]" />
        </div>
        <select className="font-mono cursor-pointer rounded-md border border-[#2E333D] bg-[#1A1E26] px-2.5 py-[7px] text-[14px] font-bold text-ink outline-none">
          <option>USDC/EURC</option>
        </select>
      </div>

      <div className="font-mono flex gap-[26px] text-[12px]">
        <Stat label="LAST PRICE" value={stats ? formatPrice(BigInt(Math.round(stats.last))) : "…"} color="text-bid" />
        <Stat
          label="24H CHANGE"
          value={stats ? `${changePositive ? "+" : ""}${stats.changePct.toFixed(2)}%` : "…"}
          color={changePositive ? "text-bid" : "text-ask"}
        />
        <Stat label="24H HIGH" value={stats ? formatPrice(BigInt(Math.round(stats.high))) : "…"} />
        <Stat label="24H LOW" value={stats ? formatPrice(BigInt(Math.round(stats.low))) : "…"} />
        <Stat label="24H VOL" value={stats ? `$${Math.round(stats.volume / 1e6).toLocaleString("en-US")}` : "…"} />
        <Stat label="SPREAD" value={spreadBps ? `${spreadBps} bps` : "—"} color="text-gold" />
      </div>

      <div className="font-mono ml-auto text-[9px] text-[#6A7280]">
        ORACLE MID{" "}
        <span className="text-[9px] font-normal">{oracleMid ? (Number(oracleMid) / 1e18).toFixed(4) : "…"}</span>{" "}
        <span className="rounded border border-gold px-[5px] py-[1px] text-gold">SIMULATED</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="mb-[3px] text-[9px] tracking-[0.1em] text-[#6A7280]">{label}</div>
      <div className={`text-[14px] font-bold ${color ?? "text-ink"}`}>{value}</div>
    </div>
  );
}
