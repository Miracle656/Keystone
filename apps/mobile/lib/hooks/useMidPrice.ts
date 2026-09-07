import { useEffect, useRef, useState } from "react";

// Ported from the design mockup's Component._tick() — a small random walk standing in for a
// live mid price until the real Pyth-sourced feed (apps/web already has this) is wired up here.
export function useMidPrice(initial = 1.1512) {
  const [mid, setMid] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const run = () => {
      setMid((m) => Math.max(1.148, Math.min(1.154, m + (Math.random() - 0.5) * 0.0005)));
      timer.current = setTimeout(run, 1600 + Math.random() * 1800);
    };
    timer.current = setTimeout(run, 1800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { mid, midDisplay: mid.toFixed(4) };
}
