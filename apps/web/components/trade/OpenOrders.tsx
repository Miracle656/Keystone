"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { KEYSTONE_BOOK_ABI } from "@keystone/shared";
import { KEYSTONE_BOOK_ADDRESS } from "@/lib/addresses";
import { useOrdersByOwner, useFillsByOwner } from "@/lib/hooks/useMarketData";
import { formatPrice, formatQty, timeAgo } from "@/lib/format";

type Tab = "open" | "history" | "fills";

export function OpenOrders() {
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("open");
  const { data: orders } = useOrdersByOwner(address);
  const { data: fills } = useFillsByOwner(address);
  const { writeContractAsync, isPending } = useWriteContract();
  const queryClient = useQueryClient();

  const open = (orders ?? []).filter((o) => o.status === "open");

  async function cancel(orderId: string) {
    try {
      await writeContractAsync({ address: KEYSTONE_BOOK_ADDRESS, abi: KEYSTONE_BOOK_ABI, functionName: "cancel", args: [BigInt(orderId)] });
      queryClient.invalidateQueries({ queryKey: ["orders", address] });
      queryClient.invalidateQueries({ queryKey: ["book"] });
    } catch (err) {
      console.error("cancel failed", err);
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "open", label: `OPEN ORDERS (${open.length})` },
    { id: "history", label: "ORDER HISTORY" },
    { id: "fills", label: "TRADE HISTORY" },
  ];

  return (
    <div className="flex h-[210px] flex-none flex-col border-t border-[#1C2028] bg-[#0E1116]">
      <div className="font-mono flex gap-1 border-b border-[#1C2028] px-4 pt-2.5 text-[11px] font-semibold tracking-[0.04em]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-2.5 pb-2.5 pt-1.5 ${t.id === tab ? "border-gold text-ink" : "border-transparent text-[#6A7280]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!address ? (
        <div className="flex flex-1 items-center justify-center text-[12px] text-[#6A7280]">Connect a wallet to see your orders</div>
      ) : tab === "fills" ? (
        <FillsTable fills={fills ?? []} owner={address} />
      ) : (
        <OrdersTable orders={tab === "open" ? open : (orders ?? [])} onCancel={cancel} canceling={isPending} />
      )}
    </div>
  );
}

function OrdersTable({
  orders,
  onCancel,
  canceling,
}: {
  orders: NonNullable<ReturnType<typeof useOrdersByOwner>["data"]>;
  onCancel: (id: string) => void;
  canceling: boolean;
}) {
  return (
    <>
      <div className="font-mono grid flex-none grid-cols-[1.2fr_0.7fr_1fr_1fr_1fr_0.8fr_60px] px-4 py-[9px] text-[9.5px] tracking-[0.06em] text-[#6A7280]">
        <span>PAIR</span>
        <span>SIDE</span>
        <span className="text-right">PRICE</span>
        <span className="text-right">AMOUNT</span>
        <span className="text-right">FILLED</span>
        <span className="text-right">STATUS</span>
        <span />
      </div>
      <div className="flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-[#565D6B]">No orders yet.</div>
        ) : (
          orders.map((o) => {
            const filledPct = o.qty === "0" ? 0 : Math.round(((Number(o.qty) - Number(o.remaining)) / Number(o.qty)) * 100);
            const statusColor = o.status === "open" ? (filledPct > 0 ? "text-bid" : "text-gold") : o.status === "filled" ? "text-bid" : "text-[#6A7280]";
            return (
              <div key={o.orderId} className="font-mono grid grid-cols-[1.2fr_0.7fr_1fr_1fr_1fr_0.8fr_60px] items-center border-b border-[#14171E] px-4 py-2.5 text-[11.5px]">
                <span className="text-[#B8BDC7]">USDC/EURC</span>
                <span className={`font-bold ${o.isBid ? "text-bid" : "text-ask"}`}>{o.isBid ? "BUY" : "SELL"}</span>
                <span className="text-right text-ink">{formatPrice(o.price)}</span>
                <span className="text-right text-[#B8BDC7]">{formatQty(o.qty)}</span>
                <span className="text-right text-[#7A828F]">{filledPct}%</span>
                <span className={`text-right font-semibold ${statusColor}`}>{o.status.toUpperCase()}</span>
                {o.status === "open" ? (
                  <button
                    onClick={() => onCancel(o.orderId)}
                    disabled={canceling}
                    className="justify-self-end rounded border border-[#2E333D] px-2 py-[3px] text-[10px] text-[#7A828F] transition-colors hover:border-ask hover:text-ask disabled:opacity-50"
                  >
                    ✕
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function FillsTable({ fills, owner }: { fills: NonNullable<ReturnType<typeof useFillsByOwner>["data"]>; owner: string }) {
  return (
    <>
      <div className="font-mono grid flex-none grid-cols-[0.9fr_1fr_1fr_1fr_1fr] px-4 py-[9px] text-[9.5px] tracking-[0.06em] text-[#6A7280]">
        <span>ROLE</span>
        <span className="text-right">PRICE</span>
        <span className="text-right">QTY</span>
        <span className="text-right">FEE</span>
        <span className="text-right">TIME</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {fills.length === 0 ? (
          <div className="px-4 py-8 text-center text-[11px] text-[#565D6B]">No fills yet.</div>
        ) : (
          fills.map((f) => {
            const isMaker = f.maker.toLowerCase() === owner.toLowerCase();
            return (
              <div key={`${f.txHash}-${f.logIndex}`} className="font-mono grid grid-cols-[0.9fr_1fr_1fr_1fr_1fr] items-center border-b border-[#14171E] px-4 py-2.5 text-[11.5px]">
                <span className={isMaker ? "text-gold" : "text-[#B8BDC7]"}>{isMaker ? "MAKER" : "TAKER"}</span>
                <span className="text-right text-ink">{formatPrice(f.price)}</span>
                <span className="text-right text-[#B8BDC7]">{formatQty(f.qty)}</span>
                <span className="text-right text-[#7A828F]">{formatUnits(BigInt(f.fee), 6)}</span>
                <span className="text-right text-[#6A7280]">{timeAgo(f.timestamp)}</span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
