"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type Voussoir = { pts: string; fill: string; delay: string };
type PriceTick = { x: string; y: string; price: string; color: string };
type TopOfBook = { price: string; size: string };

interface ArchData {
  voussoirs: Voussoir[];
  ticks: PriceTick[];
  bestBid: TopOfBook;
  bestAsk: TopOfBook;
}

// Dark-theme palette for the arch SVG (matches Arc's brand navy). Kept as
// hardcoded hex here — same approach the original design used — rather than
// Tailwind classes, since these are raw SVG fill/stroke attributes.
const BID_STONE = "#1E3A2E";
const ASK_STONE = "#3B2228";
const KEY_STONE = "#C0882E";
const STONE_STROKE = "rgba(245,241,230,0.22)";
const LINE = "#F5F1E6";
const FAINT = "#8B98AC";
const GOLD = "#E7B25A";
const BID = "#2FBF71";
const ASK = "#E5484D";

// SIMULATED: book-level geometry is a randomized visual placeholder generated
// once per page load. It becomes a real read of KeystoneBook's price levels
// once the indexer's /api/book/:pair endpoint exists (Phase 4/5).
//
// `rand` is injectable so the initial (SSR + first client render) pass can use
// a fixed sequence — real Math.random() only kicks in client-side in a
// post-mount effect, otherwise server and client render different geometry
// and React throws a hydration mismatch.
function buildArch(rand: () => number = Math.random): ArchData {
  const cx = 300;
  const cy = 400;
  const N = 13;
  const base = 150;
  const mid = 1.1512;
  const tick = 0.0004;
  const K = (N - 1) / 2;
  const gap = 0.01;

  const voussoirs: Voussoir[] = [];
  const ticks: PriceTick[] = [];
  let cumL = 0;
  let cumR = 0;
  let bestBid: TopOfBook | null = null;
  let bestAsk: TopOfBook | null = null;

  const pol = (ang: number, rad: number) =>
    `${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy - rad * Math.sin(ang)).toFixed(1)}`;

  for (let i = 0; i < N; i++) {
    const a0 = Math.PI - (Math.PI * i) / N;
    const a1 = Math.PI - (Math.PI * (i + 1)) / N;
    const s = a0 - gap;
    const e = a1 + gap;
    const k = Math.abs(i - K);
    const isKey = i === K;
    const isBid = i < K;
    const size = isKey ? 0 : Math.round(900 + rand() * 3600);
    if (isBid) cumL += size;
    else if (!isKey) cumR += size;
    const cum = isKey ? 0 : isBid ? cumL : cumR;
    const depth = isKey ? 40 : 30 + Math.min(96, cum / 130);
    const R = base + depth;
    const r = base;
    const pts = [pol(s, R), pol(e, R), pol(e, r), pol(s, r)].join(" ");
    const fill = isKey ? KEY_STONE : isBid ? BID_STONE : ASK_STONE;
    voussoirs.push({ pts, fill, delay: `${(0.35 + i * 0.045).toFixed(2)}s` });

    if (!isKey) {
      const price = isBid ? mid - k * tick : mid + k * tick;
      if (isBid && k === 1) bestBid = { price: price.toFixed(4), size: size.toLocaleString("en-US") };
      if (!isBid && k === 1) bestAsk = { price: price.toFixed(4), size: size.toLocaleString("en-US") };
      if (k % 2 === 1 && k <= 5) {
        const ma = (s + e) / 2;
        const rad = R + 15;
        ticks.push({
          x: (cx + rad * Math.cos(ma)).toFixed(1),
          y: (cy - rad * Math.sin(ma) + 3).toFixed(1),
          price: price.toFixed(4),
          color: isBid ? BID : ASK,
        });
      }
    }
  }

  return {
    voussoirs,
    ticks,
    bestBid: bestBid ?? { price: "1.1510", size: "2,400" },
    bestAsk: bestAsk ?? { price: "1.1514", size: "2,100" },
  };
}

// Deterministic placeholder for the SSR + first client render pass — same
// output every time, so hydration never mismatches. Replaced by a real
// random draw client-side once mounted (see effect below).
const fixedRand = () => 0.5;

export function KeystoneArch() {
  const [arch, setArch] = useState<ArchData>(() => buildArch(fixedRand));
  const [mid, setMid] = useState(1.1512);
  const [spreadBps, setSpreadBps] = useState(3.5);
  const stoneRefs = useRef<(SVGPolygonElement | null)[]>([]);
  const keyIndex = (arch.voussoirs.length - 1) / 2;

  // Randomize book geometry once, client-side only, after hydration completes.
  useEffect(() => {
    setArch(buildArch());
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let timer: ReturnType<typeof setTimeout>;
    const flash = (el: SVGPolygonElement | null) => {
      if (!el) return;
      gsap.fromTo(el, { filter: "brightness(1.6)" }, { filter: "brightness(1)", duration: 0.7 });
    };
    const tick = () => {
      setMid((m) => Math.max(1.148, Math.min(1.154, m + (Math.random() - 0.5) * 0.0006)));
      setSpreadBps((s) => Math.max(2.1, Math.min(6.5, s + (Math.random() - 0.5) * 0.6)));
      flash(stoneRefs.current[keyIndex]);
      flash(stoneRefs.current[Math.floor(Math.random() * stoneRefs.current.length)]);
      timer = setTimeout(tick, 1500 + Math.random() * 1700);
    };
    timer = setTimeout(tick, 2600);
    return () => clearTimeout(timer);
  }, [keyIndex]);

  return (
    <div className="relative">
      <svg viewBox="0 0 600 470" className="h-auto w-full overflow-visible">
        <line x1={40} y1={400} x2={560} y2={400} stroke={LINE} strokeOpacity={0.28} strokeWidth={1} strokeDasharray="2 4" />
        <line x1={300} y1={88} x2={300} y2={418} stroke={LINE} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="2 4" />
        <path d="M 92 400 A 208 208 0 0 1 508 400" fill="none" stroke={LINE} strokeOpacity={0.12} strokeWidth={1} />
        <path d="M 148 400 A 152 152 0 0 1 452 400" fill="none" stroke={LINE} strokeOpacity={0.12} strokeWidth={1} />
        <line x1={50} y1={432} x2={550} y2={432} stroke={LINE} strokeOpacity={0.4} strokeWidth={1} />
        <line x1={50} y1={426} x2={50} y2={438} stroke={LINE} strokeOpacity={0.4} strokeWidth={1} />
        <line x1={550} y1={426} x2={550} y2={438} stroke={LINE} strokeOpacity={0.4} strokeWidth={1} />
        <text x={300} y={452} textAnchor="middle" className="font-mono" fontSize={11} fill={FAINT} letterSpacing={1}>
          SPAN · USDC ⇄ EURC
        </text>
        <line x1={34} y1={150} x2={34} y2={400} stroke={LINE} strokeOpacity={0.4} strokeWidth={1} />
        <text x={26} y={290} textAnchor="middle" className="font-mono" fontSize={11} fill={FAINT} transform="rotate(-90 26 290)">
          CUMULATIVE DEPTH
        </text>

        <g>
          {arch.voussoirs.map((v, i) => (
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

        <g style={{ animation: "ks-set 0.5s ease 0.95s both" }}>
          {arch.ticks.map((t, i) => (
            <text key={i} x={t.x} y={t.y} textAnchor="middle" className="font-mono" fontSize={9} fill={t.color}>
              {t.price}
            </text>
          ))}
        </g>

        <line x1={300} y1={150} x2={452} y2={92} stroke={GOLD} strokeWidth={1} />
        <circle cx={300} cy={150} r={3} fill={GOLD} />
        <g style={{ animation: "ks-set 0.5s ease 1.05s both" }}>
          <text x={458} y={84} className="font-mono" fontSize={12} fill={LINE} fontWeight={700}>
            KEYSTONE · MID
          </text>
          <text x={458} y={103} className="font-mono" fontSize={16} fill={GOLD} fontWeight={700}>
            {mid.toFixed(4)}
          </text>
          <text x={458} y={121} className="font-mono" fontSize={10} fill={FAINT}>
            SPREAD <tspan fill={LINE} fontWeight={700}>{spreadBps.toFixed(1)} bps</tspan>
          </text>
        </g>

        <g style={{ animation: "ks-set 0.5s ease 1.1s both" }}>
          <line x1={252} y1={196} x2={196} y2={232} stroke={BID} strokeOpacity={0.6} strokeWidth={1} />
          <text x={192} y={230} textAnchor="end" className="font-mono" fontSize={10.5} fill={BID} fontWeight={700}>
            BEST BID {arch.bestBid.price}
          </text>
          <text x={192} y={245} textAnchor="end" className="font-mono" fontSize={9.5} fill={FAINT}>
            {arch.bestBid.size} USDC
          </text>
          <line x1={348} y1={196} x2={404} y2={232} stroke={ASK} strokeOpacity={0.6} strokeWidth={1} />
          <text x={408} y={230} className="font-mono" fontSize={10.5} fill={ASK} fontWeight={700}>
            BEST ASK {arch.bestAsk.price}
          </text>
          <text x={408} y={245} className="font-mono" fontSize={9.5} fill={FAINT}>
            {arch.bestAsk.size} USDC
          </text>
        </g>

        <text x={86} y={392} className="font-mono" fontSize={12} fill={BID} fontWeight={700} style={{ animation: "ks-set 0.5s ease 1.15s both" }}>
          BIDS ▸
        </text>
        <text x={472} y={392} className="font-mono" fontSize={12} fill={ASK} fontWeight={700} style={{ animation: "ks-set 0.5s ease 1.15s both" }}>
          ◂ ASKS
        </text>
      </svg>
    </div>
  );
}
