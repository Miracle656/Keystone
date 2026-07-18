import { Reveal } from "./Reveal";

const pairs = ["BRLA R$", "JPYC ¥", "MXNB $", "PHPC ₱", "KRW1 ₩", "QCAD $", "AUDF $"];

export function Roadmap() {
  return (
    <section className="mx-auto mt-[120px] max-w-[1280px] px-[30px]">
      <Reveal>
        <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
          <h2 className="m-0 max-w-[620px] font-display text-[28px] leading-[1.04] tracking-[-0.01em] sm:text-[38px]">
            The FX venue for internet money.
          </h2>
          <p className="m-0 max-w-[300px] text-right font-mono text-xs tracking-[0.08em] text-ink-faint">
            EVERY REGIONAL STABLECOIN LANDING ON ARC BECOMES A PAIR ON THE BOOK.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="rounded-md bg-ink px-5 py-3 font-mono text-sm font-bold text-cream">
            USDC/EURC — LIVE
          </span>
          {pairs.map((p) => (
            <span
              key={p}
              className="rounded-md border border-ink/18 bg-panel px-5 py-3 font-mono text-sm text-ink-muted"
            >
              {p}
            </span>
          ))}
          <span className="rounded-md border border-dashed border-ink/28 px-5 py-3 font-mono text-sm text-ink-faint/80">
            + YOURS
          </span>
        </div>
      </Reveal>
    </section>
  );
}
