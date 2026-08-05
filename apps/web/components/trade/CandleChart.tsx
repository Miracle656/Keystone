"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { useCandles } from "@/lib/hooks/useMarketData";
import { formatPrice } from "@/lib/format";

const INTERVALS = ["5m", "15m", "1h", "4h", "1d"] as const;
const INTERVAL_LABELS: Record<(typeof INTERVALS)[number], string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1H",
  "4h": "4H",
  "1d": "1D",
};

const BID = "#2FBF71";
const ASK = "#E5484D";

export function CandleChart({ pairId }: { pairId: number }) {
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]>("5m");
  const { data: candles, isLoading } = useCandles(pairId, interval, 200);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const hasData = !!candles && candles.length > 0;
  const latest = hasData ? candles[candles.length - 1] : null;

  // Chart lifecycle: created once per mount, destroyed on unmount — lightweight-charts is
  // fully imperative (no React reconciliation of its internals), so it's isolated behind refs.
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#6A7280", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 },
      grid: { vertLines: { visible: false }, horzLines: { color: "#14171E" } },
      rightPriceScale: { borderColor: "#1C2028" },
      timeScale: { borderColor: "#1C2028", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "#2E333D", labelBackgroundColor: "#14171E" }, horzLine: { color: "#2E333D", labelBackgroundColor: "#14171E" } },
      autoSize: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: BID,
      downColor: ASK,
      borderVisible: false,
      wickUpColor: BID,
      wickDownColor: ASK,
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles) return;
    candleSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.bucket as UTCTimestamp,
        open: c.open / 1e6,
        high: c.high / 1e6,
        low: c.low / 1e6,
        close: c.close / 1e6,
      })),
    );
    volumeSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.bucket as UTCTimestamp,
        value: c.volume / 1e6,
        color: c.close >= c.open ? "rgba(47,191,113,0.4)" : "rgba(229,72,77,0.4)",
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-[14px] pb-2 pt-3">
      <div className="font-mono mb-2.5 flex flex-none items-center gap-3.5 text-[11px] text-[#7A828F]">
        <div className="flex gap-[3px]">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`rounded px-2 py-1 transition-colors ${interval === iv ? "bg-[#1A1E26] text-ink" : "hover:text-ink"}`}
            >
              {INTERVAL_LABELS[iv]}
            </button>
          ))}
        </div>
        <span className="text-[#3A404C]">|</span>
        <span>USDC/EURC · {INTERVAL_LABELS[interval]} · Keystone Indexer</span>
        {latest && (
          <span className="ml-auto text-[#6A7280]">
            O <span className="text-bid">{formatPrice(BigInt(Math.round(latest.open)))}</span>{" "}
            H <span className="text-bid">{formatPrice(BigInt(Math.round(latest.high)))}</span>{" "}
            L <span className="text-ask">{formatPrice(BigInt(Math.round(latest.low)))}</span>{" "}
            C <span className={latest.close >= latest.open ? "text-bid" : "text-ask"}>{formatPrice(BigInt(Math.round(latest.close)))}</span>
          </span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0C0E13]/60 text-[13px] text-[#6A7280]">Loading chart…</div>
        )}
        {!isLoading && !hasData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-[13px] text-[#6A7280]">No trades yet on this timeframe</div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
