"use client";

import { useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { BALANCE_MANAGER_ABI, PAIR_REGISTRY_ABI } from "@keystone/shared";
import { BALANCE_MANAGER_ADDRESS, PAIR_REGISTRY_ADDRESS, USDC_ADDRESS, EURC_ADDRESS, USDC_EURC_PAIR_ID } from "@/lib/addresses";
import { usePairs, useBook } from "@/lib/hooks/useMarketData";
import { useOrderTicket } from "@/lib/hooks/useOrderTicket";
import { parsePrice, parseQty, roundToTick, roundToLot, notional } from "@/lib/orderMath";
import { formatPrice } from "@/lib/format";

type OrderType = "limit" | "market";
type Side = "buy" | "sell";

export function OrderTicket() {
  const { address, isConnected } = useAccount();
  const { data: pairs } = usePairs();
  const { data: book } = useBook(0);
  const pair = pairs?.find((p) => p.pairId === 0);
  const tick = pair ? BigInt(pair.tickSize) : 100n;
  const lot = pair ? BigInt(pair.lotSize) : 1_000_000n;
  const mid = book?.bestBid && book?.bestAsk ? (BigInt(book.bestBid) + BigInt(book.bestAsk)) / 2n : null;

  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [side, setSide] = useState<Side>("buy");
  const [priceInput, setPriceInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIoc] = useState(false);

  const { depositToTrading, placeLimit, placeMarket, status, error, setError } = useOrderTicket();

  const isBid = side === "buy";
  // BUY: amount is quoted in USDC (how much to spend); SELL: amount is quoted in EURC (how
  // much base to sell) — matches the mockup's "AMOUNT ... USDC" / "ORDER VALUE ... EURC"
  // pattern, generalized to be dimensionally correct on both sides rather than USDC-only.
  const amountCcy = isBid ? "USDC" : "EURC";
  const valueCcy = isBid ? "EURC" : "USDC";

  const { data: balances } = useReadContracts({
    contracts: address
      ? [
          { address: BALANCE_MANAGER_ADDRESS, abi: BALANCE_MANAGER_ABI, functionName: "balanceOf", args: [address, USDC_ADDRESS] },
          { address: BALANCE_MANAGER_ADDRESS, abi: BALANCE_MANAGER_ABI, functionName: "balanceOf", args: [address, EURC_ADDRESS] },
        ]
      : [],
    query: { enabled: !!address, refetchInterval: 4000 },
  });
  const [usdcBalance, eurcBalance] = balances?.map((d) => (d.status === "success" ? (d.result as bigint) : 0n)) ?? [0n, 0n];
  const relevantBalance = isBid ? usdcBalance : eurcBalance;

  const { data: pairInfo } = useReadContract({
    address: PAIR_REGISTRY_ADDRESS,
    abi: PAIR_REGISTRY_ABI,
    functionName: "getPair",
    args: [USDC_EURC_PAIR_ID],
  });

  const price = orderType === "limit" ? roundToTick(parsePrice(priceInput), tick, isBid ? "down" : "up") : mid ?? 0n;
  const amount = parseQty(amountInput); // raw 6-decimal units of amountCcy
  // qty is always in EURC (base) terms on-chain regardless of side.
  const qty = roundToLot(isBid ? (price > 0n ? (amount * 1_000_000n) / price : 0n) : amount, lot);
  const orderValue = isBid ? qty : notional(price, amount);

  async function handleSubmit() {
    if (!address || qty === 0n) return;
    try {
      const flags = postOnly ? true : false;
      if (orderType === "limit") {
        if (price === 0n) return;
        await placeLimit(USDC_EURC_PAIR_ID, isBid, price, qty, flags, ioc);
      } else {
        if (!book?.bestBid && !book?.bestAsk) {
          setError("No liquidity on the book to market-fill against");
          return;
        }
        const worst = isBid
          ? book?.bestAsk
            ? roundToTick((BigInt(book.bestAsk) * 103n) / 100n, tick, "up")
            : 0n
          : book?.bestBid
            ? roundToTick((BigInt(book.bestBid) * 97n) / 100n, tick, "down")
            : 0n;
        await placeMarket(USDC_EURC_PAIR_ID, isBid, qty, worst);
      }
      setAmountInput("");
    } catch {
      // error already captured in the hook's `error` state
    }
  }

  const relevantToken = isBid ? USDC_ADDRESS : EURC_ADDRESS;
  const requiredAmount = isBid ? amount : qty;
  const shortfall = requiredAmount > relevantBalance ? requiredAmount - relevantBalance : 0n;

  return (
    <div className="flex flex-col overflow-y-auto bg-[#0E1116] px-4 py-5">
      <div className="mb-4 flex gap-1.5">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className="font-mono flex-1 rounded-md py-[11px] text-[13px] font-bold"
            style={{
              background: side === s ? (s === "buy" ? "#2FBF71" : "#E5484D") : "#14171E",
              color: side === s ? (s === "buy" ? "#08240F" : "#2A0A0A") : "#7A828F",
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="font-mono mb-4 flex gap-4 text-[11px]">
        {(["limit", "market"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`border-b-2 pb-[5px] font-bold tracking-[0.06em] ${
              orderType === t ? "border-gold text-ink" : "border-transparent text-[#6A7280]"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {orderType === "limit" && (
        <div className="mb-3">
          <div className="font-mono mb-1.5 flex justify-between text-[10px] tracking-[0.08em] text-[#6A7280]">
            <span>PRICE</span>
            <button onClick={() => mid && setPriceInput(formatUnits(mid, 6))} className="text-gold" disabled={!mid}>
              MID
            </button>
          </div>
          <div className="flex overflow-hidden rounded-md border border-[#2E333D]">
            <input
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="1.1435"
              inputMode="decimal"
              className="font-mono min-w-0 flex-1 bg-[#14171E] px-3 py-[11px] text-[14px] text-ink outline-none focus:bg-[#181C24]"
            />
            <span className="font-mono flex items-center border-l border-[#2E333D] bg-[#14171E] px-3 text-[11px] text-[#6A7280]">EURC</span>
          </div>
        </div>
      )}

      <div className="mb-2.5">
        <div className="font-mono mb-1.5 text-[10px] tracking-[0.08em] text-[#6A7280]">AMOUNT</div>
        <div className="flex overflow-hidden rounded-md border border-[#2E333D]">
          <input
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="font-mono min-w-0 flex-1 bg-[#14171E] px-3 py-[11px] text-[14px] text-ink outline-none focus:bg-[#181C24]"
          />
          <span className="font-mono flex items-center border-l border-[#2E333D] bg-[#14171E] px-3 text-[11px] text-[#6A7280]">{amountCcy}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-1.5">
        {[25, 50, 75, 100].map((p) => (
          <button
            key={p}
            onClick={() => setAmountInput(formatUnits((relevantBalance * BigInt(p)) / 100n, 6))}
            className="font-mono rounded-[5px] border border-[#2E333D] bg-[#14171E] py-[7px] text-[11px] text-[#9AA1AE] transition-colors hover:border-[#565D6B] hover:text-ink"
          >
            {p}%
          </button>
        ))}
      </div>

      <div className="mb-3.5">
        <div className="font-mono mb-1.5 text-[10px] tracking-[0.08em] text-[#6A7280]">ORDER VALUE</div>
        <div className="flex overflow-hidden rounded-md border border-[#22262E] bg-[#101319]">
          <span className="font-mono flex-1 px-3 py-[11px] text-[14px] text-[#B8BDC7]">
            {amount > 0n ? formatUnits(orderValue, 6) : "0.00"}
          </span>
          <span className="font-mono flex items-center border-l border-[#22262E] px-3 text-[11px] text-[#6A7280]">{valueCcy}</span>
        </div>
      </div>

      <div className="font-mono mb-[18px] flex items-center justify-between text-[11px] text-[#7A828F]">
        <div className="flex gap-3.5">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={postOnly}
              onChange={(e) => {
                setPostOnly(e.target.checked);
                if (e.target.checked) setIoc(false);
              }}
              className="accent-gold"
            />
            Post-only
          </label>
          {orderType === "limit" && (
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={ioc}
                onChange={(e) => {
                  setIoc(e.target.checked);
                  if (e.target.checked) setPostOnly(false);
                }}
                className="accent-gold"
              />
              IOC
            </label>
          )}
        </div>
        <span>
          TIF <span className="text-ink">{ioc ? "IOC" : "GTC"}</span>
        </span>
      </div>

      {shortfall > 0n && isConnected && (
        <div className="mb-3 rounded border border-gold/40 bg-gold/10 p-2.5">
          <div className="font-mono mb-2 text-[11px] text-[#B8BDC7]">
            Not enough {amountCcy} in your trading balance — deposit {formatUnits(shortfall, 6)} more first.
          </div>
          <button
            onClick={() => depositToTrading(relevantToken, shortfall)}
            disabled={!!status}
            className="font-mono w-full rounded bg-ink py-2 text-[12px] font-bold text-[#0B0D12] disabled:opacity-50"
          >
            {status ?? `Deposit ${formatUnits(shortfall, 6)} ${amountCcy}`}
          </button>
        </div>
      )}

      {error && <div className="font-mono mb-3 rounded border border-ask/40 bg-ask-soft p-2.5 text-[11px] text-ask">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={!isConnected || qty === 0n || shortfall > 0n || !!status}
        className="font-mono w-full rounded-md py-[14px] text-[13.5px] font-bold tracking-[0.04em] disabled:opacity-40"
        style={{ background: isBid ? "#2FBF71" : "#E5484D", color: isBid ? "#08240F" : "#2A0A0A" }}
      >
        {!isConnected ? "Connect wallet" : status ?? `${side.toUpperCase()} ${amountCcy} · ${orderType.toUpperCase()}`}
      </button>

      <div className="font-mono mt-[18px] grid gap-2.5 border-t border-[#1C2028] pt-4 text-[11px] text-[#6A7280]">
        <Row label="USDC BALANCE" value={formatUnits(usdcBalance, 6)} />
        <Row label="EURC BALANCE" value={formatUnits(eurcBalance, 6)} />
        <Row
          label="TAKER / MAKER FEE"
          value={pairInfo ? `${(pairInfo.takerFeeBps / 100).toFixed(2)} / ${(pairInfo.makerFeeBps / 100).toFixed(2)} bps` : "…"}
        />
        <Row label="EST. NETWORK FEE" value="< $0.01 flat" valueClassName="text-bid" />
      </div>
    </div>
  );
}

function Row({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={valueClassName ?? "text-ink"}>{value}</span>
    </div>
  );
}
