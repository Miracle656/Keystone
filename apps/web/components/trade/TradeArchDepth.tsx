"use client";

import { useRef } from "react";
import { useBook } from "@/lib/hooks/useMarketData";
import { formatPrice } from "@/lib/format";

// Same visual language as components/landing/KeystoneArch.tsx's signature arch, but driven by
// real KeystoneBook depth (via the indexer) instead of randomized placeholder geometry — this
// is the actual PRD §8 "signature element" applied to live data, not the Landing teaser.
const BID_STONE = "#1E3A2E";
const ASK_STONE = "#3B2228";
const KEY_STONE = "#C0882E";
const STONE_STROKE = "rgba(245,241,230,0.22)";
const LINE = "#F5F1E6";
const FAINT = "#8B98AC";
const GOLD = "#E7B25A";
const BID = "#2FBF71";
const ASK = "#E5484D";

const MAX_LEVELS_PER_SIDE = 6;

export function TradeArchDepth({ pairId }: { pairId: number }) {
  const { data: book, isLoading } = useBook(pairId);
  const stoneRefs = useRef<(SVGPolygonElement | null)[]>([]);

  const bids = (book?.bids ?? []).slice(0, MAX_LEVELS_PER_SIDE);
  const asks = (book?.asks ?? []).slice(0, MAX_LEVELS_PER_SIDE);
  const hasBook = bids.length > 0 || asks.length > 0;

  const N = bids.length + asks.length + 1;
  const K = bids.length; // index of the keystone in the 0..N-1 sequence
  const cx = 300;
  const cy = 400;
  const base = 150;
  const gap = 0.01;

  const pol = (ang: number, rad: number) => `${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy - rad * Math.sin(ang)).toFixed(1)}`;

  const maxQty = Math.max(1, ...bids.map((b) => Number(b.qty)), ...asks.map((a) => Number(a.qty)));

  const stones: { pts: string; fill: string; delay: string }[] = [];
  let cumBid = 0;
  let cumAsk = 0;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI - (Math.PI * i) / N;
    const a1 = Math.PI - (Math.PI * (i + 1)) / N;
    const s = a0 - gap;
    const e = a1 + gap;
    const isKey = i === K;
    const isBid = i < K;
    let depth = 40;
    if (!isKey) {
      const level = isBid ? bids[i] : asks[i - K - 1];
      const qty = level ? Number(level.qty) : 0;
      if (isBid) cumBid += qty;
      else cumAsk += qty;
      const cum = isBid ? cumBid : cumAsk;
      depth = 30 + Math.min(96, (cum / maxQty) * 96);
    }
    const R = base + depth;
    const pts = [pol(s, R), pol(e, R), pol(e, base), pol(s, base)].join(" ");
    stones.push({ pts, fill: isKey ? KEY_STONE : isBid ? BID_STONE : ASK_STONE, delay: `${(0.05 + i * 0.035).toFixed(2)}s` });
  }

  const mid = book?.bestBid && book?.bestAsk ? (BigInt(book.bestBid) + BigInt(book.bestAsk)) / 2n : null;
  const spreadBps =
    book?.bestBid && book?.bestAsk
      ? (((Number(book.bestAsk) - Number(book.bestBid)) / Number(book.bestBid)) * 10000).toFixed(1)
      : null;

  return (
    <div className="relative border border-ink-line bg-panel p-4">
      <svg viewBox="0 0 600 470" className="h-auto w-full overflow-visible">
        <line x1={40} y1={400} x2={560} y2={400} stroke={LINE} strokeOpacity={0.28} strokeWidth={1} strokeDasharray="2 4" />
        <line x1={300} y1={88} x2={300} y2={418} stroke={LINE} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="2 4" />
        <text x={300} y={452} textAnchor="middle" className="font-mono" fontSize={11} fill={FAINT} letterSpacing={1}>
          USDC ⇄ EURC — LIVE DEPTH
        </text>

        {hasBook && (
          <g>
            {stones.map((v, i) => (
              <polygon
                key={i}
                ref={(el) => {
                  stoneRefs.current[i] = el;
                }}
                points={v.pts}
                fill={v.fill}
                stroke={STONE_STROKE}
                strokeWidth={1.5}
                style={{ animation: `ks-set 0.5s ease ${v.delay} both` }}
              />
            ))}
          </g>
        )}

        {mid !== null && (
          <g style={{ animation: "ks-set 0.5s ease 0.5s both" }}>
            <line x1={300} y1={150} x2={452} y2={92} stroke={GOLD} strokeWidth={1} />
            <circle cx={300} cy={150} r={3} fill={GOLD} />
            <text x={458} y={84} className="font-mono" fontSize={12} fill={LINE} fontWeight={700}>
              KEYSTONE · MID
            </text>
            <text x={458} y={103} className="font-mono" fontSize={16} fill={GOLD} fontWeight={700}>
              {formatPrice(mid)}
            </text>
            {spreadBps && (
              <text x={458} y={121} className="font-mono" fontSize={10} fill={FAINT}>
                SPREAD <tspan fill={LINE} fontWeight={700}>{spreadBps} bps</tspan>
              </text>
            )}
          </g>
        )}

        <text x={86} y={392} className="font-mono" fontSize={12} fill={BID} fontWeight={700}>
          BIDS ▸
        </text>
        <text x={472} y={392} className="font-mono" fontSize={12} fill={ASK} fontWeight={700}>
          ◂ ASKS
        </text>

        {!hasBook && !isLoading && (
          <text x={300} y={280} textAnchor="middle" className="font-mono" fontSize={13} fill={FAINT}>
            Book is empty — no resting orders yet
          </text>
        )}
      </svg>
    </div>
  );
}
