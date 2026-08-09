"use client";

import { useState } from "react";
import { usePublicClient } from "wagmi";
import { decodeEventLog, type Hash } from "viem";
import { KEYSTONE_BOOK_ABI } from "@keystone/shared";
import { KEYSTONE_BOOK_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";
import { formatPrice, formatQty } from "@/lib/format";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type DecodedEvent = { eventName: string; rows: { label: string; value: string }[] };

function describeEvent(eventName: string, args: Record<string, unknown>): DecodedEvent["rows"] {
  switch (eventName) {
    case "OrderPlaced":
      return [
        { label: "ORDER ID", value: String(args.orderId) },
        { label: "OWNER", value: short(String(args.owner)) },
        { label: "SIDE", value: args.isBid ? "BUY" : "SELL" },
        { label: "PRICE", value: formatPrice(args.price as bigint) },
        { label: "QTY", value: formatQty(args.qty as bigint) },
      ];
    case "OrderFilled":
      return [
        { label: "ORDER ID", value: String(args.orderId) },
        { label: "MAKER", value: short(String(args.maker)) },
        { label: "TAKER", value: short(String(args.taker)) },
        { label: "PRICE", value: formatPrice(args.price as bigint) },
        { label: "QTY", value: formatQty(args.qty as bigint) },
        { label: "FEE", value: formatQty(args.fee as bigint) + " USDC" },
      ];
    case "OrderCanceled":
      return [
        { label: "ORDER ID", value: String(args.orderId) },
        { label: "REFUNDED QTY", value: formatQty(args.refundedQty as bigint) },
      ];
    case "TradeExecuted":
      return [
        { label: "PAIR ID", value: String(args.pairId) },
        { label: "PRICE", value: formatPrice(args.price as bigint) },
        { label: "QTY", value: formatQty(args.qty as bigint) },
        { label: "TAKER SIDE", value: args.takerIsBid ? "BUY" : "SELL" },
      ];
    default:
      return [];
  }
}

export function VerifyFill() {
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [txInput, setTxInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [blockNumber, setBlockNumber] = useState<bigint | null>(null);

  async function verify() {
    const hash = txInput.trim() as Hash;
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      setStatus("error");
      setError("Not a valid transaction hash — expected 0x followed by 64 hex characters.");
      return;
    }
    if (!publicClient) return;
    setStatus("loading");
    setError(null);
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash });
      const bookLogs = receipt.logs.filter((l) => l.address.toLowerCase() === KEYSTONE_BOOK_ADDRESS.toLowerCase());

      const decoded: DecodedEvent[] = [];
      for (const log of bookLogs) {
        try {
          const parsed = decodeEventLog({ abi: KEYSTONE_BOOK_ABI, data: log.data, topics: log.topics });
          if (parsed.eventName === "LevelChanged") continue;
          decoded.push({ eventName: parsed.eventName, rows: describeEvent(parsed.eventName, parsed.args as Record<string, unknown>) });
        } catch {
          // Not a KeystoneBook event this ABI knows how to decode — skip silently.
        }
      }

      if (decoded.length === 0) {
        setStatus("error");
        setError(
          receipt.status === "reverted"
            ? "This transaction reverted — nothing was decoded."
            : "No KeystoneBook events found in this transaction.",
        );
        return;
      }

      setEvents(decoded);
      setBlockNumber(receipt.blockNumber);
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Couldn't fetch that transaction on Arc Testnet — check the hash and try again.");
    }
  }

  return (
    <div className="self-start rounded-2xl border border-gold bg-panel shadow-[0_16px_40px_rgba(231,178,90,0.08)]">
      <div className="font-mono border-b border-ink-line px-[22px] py-4 text-[11px] font-bold tracking-[0.14em] text-gold">
        VERIFY A FILL
      </div>
      <div className="p-[22px]">
        <p className="mb-3.5 text-[13px] leading-[1.55] text-ink-muted">
          Paste any Arc Testnet transaction hash. We decode the real KeystoneBook event logs straight from the chain — no database,
          no trust.
        </p>
        <div className="mb-4 flex">
          <input
            value={txInput}
            onChange={(e) => setTxInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verify()}
            placeholder="0x…"
            className="font-mono min-w-0 flex-1 rounded-l-md border-[1.5px] border-r-0 border-ink-line bg-parchment px-3 py-[11px] text-[13px] text-ink outline-none focus:border-gold"
          />
          <button
            onClick={verify}
            disabled={status === "loading"}
            className="font-mono rounded-r-md bg-ink px-[18px] text-[12px] font-bold text-cream transition-colors hover:bg-gold hover:text-cream disabled:opacity-60"
          >
            {status === "loading" ? "DECODING…" : "DECODE"}
          </button>
        </div>

        {status === "error" && error && (
          <div className="font-mono rounded-lg border border-ask bg-ask-soft px-4 py-3 text-[12px] text-ask">{error}</div>
        )}

        {status === "done" && (
          <div className="font-mono grid gap-3.5 rounded-lg border border-bid bg-bid-soft p-4 text-[12px]">
            {events.map((ev, i) => (
              <div key={i} className={i > 0 ? "border-t border-ink-line pt-3.5" : ""}>
                <div className="mb-2 text-[11px] font-bold tracking-[0.1em] text-bid">✓ {ev.eventName} — DECODED</div>
                <div className="grid gap-1.5">
                  {ev.rows.map((r) => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-ink-soft">{r.label}</span>
                      <span className="text-ink">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {blockNumber !== null && (
              <div className="flex justify-between border-t border-ink-line pt-3.5">
                <span className="text-ink-soft">SETTLED</span>
                <span className="text-bid">block {blockNumber.toLocaleString("en-US")}</span>
              </div>
            )}
            <a
              href={`${arcTestnet.blockExplorers.default.url}/tx/${txInput.trim()}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-[11px] text-gold hover:text-ink"
            >
              OPEN ON ARCSCAN →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
